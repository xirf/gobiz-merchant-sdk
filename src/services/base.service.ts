import type { GoBizConfig, GoBizApiResponse } from '../types/common.js';
import type { GoAuthService } from './auth.service.js';
import { GoBizError } from '../errors/gobiz-error.js';

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  scope: string;
  body?: any;
  queryParams?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
  customHeaders?: Record<string, string>;
}

export abstract class BaseService {
  protected config: GoBizConfig;
  protected auth: GoAuthService;

  constructor(config: GoBizConfig, auth: GoAuthService) {
    this.config = config;
    this.auth = auth;
  }

  protected async request<T>(options: RequestOptions): Promise<T> {
    const token = await this.auth.getAccessToken(options.scope);
    const baseUrl = this.auth.getApiBaseUrl();

    let url = `${baseUrl}${options.path.startsWith('/') ? options.path : '/' + options.path}`;

    if (options.queryParams) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.queryParams)) {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...options.customHeaders,
    };

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    let bodyPayload: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      bodyPayload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const fetchFn = this.config.fetch || globalThis.fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

    try {
      const response = await fetchFn(url, {
        method: options.method,
        headers,
        body: bodyPayload,
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

      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        const apiResponse = responseData as GoBizApiResponse<T>;
        if (apiResponse.success === false) {
          throw GoBizError.fromResponse(response.status, responseData);
        }
        return (apiResponse.data !== undefined ? apiResponse.data : responseData) as T;
      }

      return responseData as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new GoBizError(`Request to ${options.path} timed out`, 408);
      }
      if (err instanceof GoBizError) {
        throw err;
      }
      throw new GoBizError(err.message || 'GoBiz API request failed', 500, [], err);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
