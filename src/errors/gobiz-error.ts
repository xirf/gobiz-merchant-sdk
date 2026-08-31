import type { GoBizApiErrorItem } from '../types/common.js';

export class GoBizError extends Error {
  public readonly status: number;
  public readonly errors: GoBizApiErrorItem[];
  public readonly rawBody?: any;
  public readonly url?: string;
  public readonly method?: string;

  constructor(
    message: string,
    status: number = 500,
    errors: GoBizApiErrorItem[] = [],
    rawBody?: any,
    url?: string,
    method?: string,
  ) {
    super(message);
    this.name = 'GoBizError';
    this.status = status;
    this.errors = errors;
    this.rawBody = rawBody;
    this.url = url;
    this.method = method;

    // Restore prototype chain
    Object.setPrototypeOf(this, GoBizError.prototype);
  }

  static fromResponse(status: number, body: any, url?: string, method?: string): GoBizError {
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

    return new GoBizError(message, status, errors, body, url, method);
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return (
      `${this.name}: ${this.message}\n` +
      `  Status: ${this.status}\n` +
      (this.url ? `  URL: ${this.method || 'REQUEST'} ${this.url}\n` : '') +
      `  Errors: ${JSON.stringify(this.errors, null, 2)}\n` +
      `  Raw Body: ${JSON.stringify(this.rawBody, null, 2)}`
    );
  }
}

