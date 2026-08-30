import type { GoBizApiErrorItem } from '../types/common.js';

export class GoBizError extends Error {
  public readonly status: number;
  public readonly errors: GoBizApiErrorItem[];
  public readonly rawBody?: any;

  constructor(message: string, status: number = 500, errors: GoBizApiErrorItem[] = [], rawBody?: any) {
    super(message);
    this.name = 'GoBizError';
    this.status = status;
    this.errors = errors;
    this.rawBody = rawBody;

    // Restore prototype chain
    Object.setPrototypeOf(this, GoBizError.prototype);
  }

  static fromResponse(status: number, body: any): GoBizError {
    let message = `GoBiz API request failed with HTTP ${status}`;
    let errors: GoBizApiErrorItem[] = [];

    if (body && typeof body === 'object') {
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        errors = body.errors;
        const descriptions = errors
          .map((e) => (e.message_title ? `[${e.message_title}] ${e.message}` : e.message))
          .join('; ');
        message = `GoBiz Error (${status}): ${descriptions}`;
      } else if (body.error_description || body.error) {
        message = `GoBiz Error (${status}): ${body.error_description || body.error}`;
      } else if (body.message) {
        message = `GoBiz Error (${status}): ${body.message}`;
      }
    } else if (typeof body === 'string' && body.length > 0) {
      message = `GoBiz Error (${status}): ${body.substring(0, 200)}`;
    }

    return new GoBizError(message, status, errors, body);
  }
}
