import { GOPAY_URLS } from './constants/urls.js';
import type { GoPayConfig } from './types/config.js';
import type { OAuthScopeType } from './constants/enums.js';
import type { OAuthTokenManager } from './auth.js';
import { GoPayError } from './errors.js';

export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  scope?: OAuthScopeType;
  contentType?: string;
  accept?: string;
  rawResponse?: boolean;
}

export class HttpClient {
  private config: GoPayConfig;
  private tokenManager: OAuthTokenManager;

  constructor(config: GoPayConfig, tokenManager: OAuthTokenManager) {
    this.config = config;
    this.tokenManager = tokenManager;
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

  public async request<T = unknown>(options: HttpRequestOptions): Promise<T> {
    const token = await this.tokenManager.getAccessToken(options.scope);
    const fetchFn = this.getFetch();

    let url = `${this.getBaseUrl()}${options.path.startsWith('/') ? options.path : `/${options.path}`}`;

    if (options.query) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }

    const headers: Record<string, string> = {
      Accept: options.accept || 'application/json',
      Authorization: `Bearer ${token}`,
    };

    let requestBody: string | undefined;
    if (options.body !== undefined) {
      if (options.contentType === 'application/x-www-form-urlencoded') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        requestBody = typeof options.body === 'string' ? options.body : new URLSearchParams(options.body as Record<string, string>).toString();
      } else {
        headers['Content-Type'] = options.contentType || 'application/json';
        requestBody = JSON.stringify(options.body);
      }
    }

    const timeout = this.config.timeoutMs ?? 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetchFn(url, {
        method: options.method,
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      if (options.rawResponse) {
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw GoPayError.fromResponse(response.status, errorData);
        }
        return (await response.text()) as unknown as T;
      }

      const responseText = await response.text();
      let responseData: unknown = null;
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }
      }

      if (!response.ok) {
        throw GoPayError.fromResponse(response.status, responseData);
      }

      return responseData as T;
    } catch (err: unknown) {
      if (err instanceof GoPayError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new GoPayError(408, `GoPay HTTP request timed out after ${timeout}ms: ${options.method} ${url}`);
      }
      throw new GoPayError(500, `GoPay HTTP request error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
