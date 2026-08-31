import type { GoBizApiErrorItem } from '../types/common.js';

export class GoBizError extends Error {
  public readonly status: number;
  public readonly errors: GoBizApiErrorItem[];
  public readonly rawBody?: any;
  public readonly url?: string;
  public readonly method?: string;
  public readonly payload?: any;

  constructor(
    message: string,
    status: number = 500,
    errors: GoBizApiErrorItem[] = [],
    rawBody?: any,
    url?: string,
    method?: string,
    payload?: any,
  ) {
    super(message);
    this.name = 'GoBizError';
    this.status = status;
    this.errors = errors;
    this.rawBody = rawBody;
    this.url = url;
    this.method = method;
    this.payload = payload;

    // Restore prototype chain
    Object.setPrototypeOf(this, GoBizError.prototype);
  }

  static fromResponse(status: number, body: any, url?: string, method?: string, payload?: any): GoBizError {
    let message = `GoBiz API request failed with HTTP ${status}`;
    let errors: GoBizApiErrorItem[] = [];

    if (body && typeof body === 'object') {
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        errors = body.errors;
        const descriptions = errors
          .map((e) => {
            const parts: string[] = [];
            if (e.message_title) parts.push(`[${e.message_title}]`);
            if (e.field) parts.push(`(field: ${e.field})`);
            if (e.code) parts.push(`(code: ${e.code})`);
            if (e.message) parts.push(e.message);
            return parts.length > 0 ? parts.join(' ') : JSON.stringify(e);
          })
          .join('; ');
        message = `GoBiz Error (${status}): ${descriptions}`;
      } else if (body.error_description || body.error) {
        message = `GoBiz Error (${status}): ${body.error_description || body.error}`;
      } else if (body.message) {
        message = `GoBiz Error (${status}): ${body.message}`;
      }
    } else if (typeof body === 'string' && body.length > 0) {
      message = `GoBiz Error (${status}): ${body.substring(0, 500)}`;
    }

    if (url) {
      message += ` [${method || 'REQUEST'} ${url}]`;
    }

    // Sanitize password in payload before storing
    let safePayload = payload;
    if (payload && typeof payload === 'object') {
      try {
        safePayload = JSON.parse(JSON.stringify(payload));
        if (safePayload.password) safePayload.password = '••••';
        if (safePayload.data?.password) safePayload.data.password = '••••';
      } catch {
        safePayload = payload;
      }
    }

    return new GoBizError(message, status, errors, body, url, method, safePayload);
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return (
      `${this.name}: ${this.message}\n` +
      `  Status: ${this.status}\n` +
      (this.url ? `  URL: ${this.method || 'REQUEST'} ${this.url}\n` : '') +
      (this.payload ? `  Request Payload: ${JSON.stringify(this.payload, null, 2)}\n` : '') +
      `  Errors: ${JSON.stringify(this.errors, null, 2)}\n` +
      `  Raw Body: ${JSON.stringify(this.rawBody, null, 2)}`
    );
  }
}

