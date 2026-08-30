import { GOPAY_URLS } from './constants/urls.js';
import { OAuthScope, type OAuthScopeType } from './constants/enums.js';
import type { GoPayConfig } from './types/config.js';
import { GoPayError } from './errors.js';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

interface OAuthTokenResponse {
  token_type?: string;
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
}

export class OAuthTokenManager {
  private config: GoPayConfig;
  private tokenCache: Map<string, CachedToken> = new Map();
  private pendingRequests: Map<string, Promise<string>> = new Map();

  constructor(config: GoPayConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl.replace(/\/+$/, '');
    }
    return this.config.isProductionMode ? GOPAY_URLS.PRODUCTION.API : GOPAY_URLS.SANDBOX.API;
  }

  private getFetch(): typeof globalThis.fetch {
    return this.config.fetch || globalThis.fetch;
  }

  /**
   * Returns a valid OAuth 2.0 Bearer access token.
   * Reuses cached token if still valid, or requests a fresh one.
   */
  public async getAccessToken(scope?: OAuthScopeType): Promise<string> {
    const targetScope = scope || this.config.defaultScope || OAuthScope.PAYMENT_ALL;
    const renewalBufferMs = (this.config.tokenRenewalBufferSeconds ?? 60) * 1000;
    const now = Date.now();

    const cached = this.tokenCache.get(targetScope);
    if (cached && now < cached.expiresAt - renewalBufferMs) {
      return cached.accessToken;
    }

    // Deduplicate in-flight requests for the same scope
    if (this.pendingRequests.has(targetScope)) {
      return this.pendingRequests.get(targetScope)!;
    }

    const tokenPromise = this.fetchNewToken(targetScope).finally(() => {
      this.pendingRequests.delete(targetScope);
    });

    this.pendingRequests.set(targetScope, tokenPromise);
    return tokenPromise;
  }

  private async fetchNewToken(scope: OAuthScopeType): Promise<string> {
    const fetchFn = this.getFetch();
    const url = `${this.getBaseUrl()}/oauth2/token`;
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope,
    }).toString();

    const timeout = this.config.timeoutMs ?? 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetchFn(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body,
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as OAuthTokenResponse | null;

      if (!response.ok) {
        throw GoPayError.fromResponse(response.status, data);
      }

      if (!data || !data.access_token) {
        throw new GoPayError(response.status, 'Invalid response from GoPay token endpoint', [], data);
      }

      const expiresInSec = typeof data.expires_in === 'number' ? data.expires_in : 1800;
      const expiresAt = Date.now() + expiresInSec * 1000;

      this.tokenCache.set(scope, {
        accessToken: data.access_token,
        expiresAt,
      });

      return data.access_token;
    } catch (err: unknown) {
      if (err instanceof GoPayError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new GoPayError(408, `Token request timed out after ${timeout}ms`);
      }
      throw new GoPayError(500, `Failed to obtain GoPay access token: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Clears in-memory token cache.
   */
  public clearCache(): void {
    this.tokenCache.clear();
  }
}
