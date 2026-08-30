import { GOBIZ_URLS, GoBizScope } from '../constants/index.js';
import type { GoBizConfig } from '../types/common.js';
import type { CachedToken, OAuthTokenResponse } from '../types/auth.js';
import { GoBizError } from '../errors/gobiz-error.js';

export class GoAuthService {
  private config: GoBizConfig;
  private tokenCache: Map<string, CachedToken> = new Map();
  private pendingRequests: Map<string, Promise<string>> = new Map();

  constructor(config: GoBizConfig) {
    this.config = config;
  }

  public getOAuthBaseUrl(): string {
    if (this.config.customOAuthBaseUrl) {
      return this.config.customOAuthBaseUrl.replace(/\/+$/, '');
    }
    return this.config.isProductionMode
      ? GOBIZ_URLS.PRODUCTION.OAUTH_BASE
      : GOBIZ_URLS.SANDBOX.OAUTH_BASE;
  }

  public getApiBaseUrl(): string {
    if (this.config.customApiBaseUrl) {
      return this.config.customApiBaseUrl.replace(/\/+$/, '');
    }
    return this.config.isProductionMode
      ? GOBIZ_URLS.PRODUCTION.API_BASE
      : GOBIZ_URLS.SANDBOX.API_BASE;
  }

  /**
   * Get an active access token for specified scope(s).
   * Caches tokens in memory, pre-emptively refreshes near expiry, and deduplicates concurrent calls.
   */
  public async getAccessToken(scope: string = GoBizScope.PAYMENT_TRANSACTION_WRITE): Promise<string> {
    const cached = this.tokenCache.get(scope);
    const now = Date.now();

    // If cached token has at least 60 seconds remaining, return it
    if (cached && cached.expiresAt - now > 60000) {
      return cached.accessToken;
    }

    // Deduplicate in-flight requests for the same scope
    if (this.pendingRequests.has(scope)) {
      return this.pendingRequests.get(scope)!;
    }

    const requestPromise = this.fetchNewToken(scope)
      .then((token) => {
        this.pendingRequests.delete(scope);
        return token;
      })
      .catch((err) => {
        this.pendingRequests.delete(scope);
        throw err;
      });

    this.pendingRequests.set(scope, requestPromise);
    return requestPromise;
  }

  private async fetchNewToken(scope: string): Promise<string> {
    const oauthUrl = `${this.getOAuthBaseUrl()}/oauth2/token`;
    const fetchFn = this.config.fetch || globalThis.fetch;

    const basicAuth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', scope);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

    try {
      const response = await fetchFn(oauthUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (!response.ok) {
        throw GoBizError.fromResponse(response.status, responseData);
      }

      const tokenData = responseData as OAuthTokenResponse;
      const expiresInMs = (tokenData.expires_in || 3600) * 1000;

      this.tokenCache.set(scope, {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresAt: Date.now() + expiresInMs,
        scope: tokenData.scope || scope,
      });

      return tokenData.access_token;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new GoBizError('OAuth token request timed out', 408);
      }
      if (err instanceof GoBizError) {
        throw err;
      }
      throw new GoBizError(err.message || 'Failed to authenticate with GoAuth', 500, [], err);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Clear all cached access tokens
   */
  public clearCache(): void {
    this.tokenCache.clear();
    this.pendingRequests.clear();
  }
}
