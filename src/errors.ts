import type { GoPayErrorItem, GoPayErrorResponseBody } from './types/errors.js';

export class GoPayError extends Error {
  public readonly status: number;
  public readonly errors: GoPayErrorItem[];
  public readonly rawBody?: unknown;

  constructor(status: number, message: string, errors: GoPayErrorItem[] = [], rawBody?: unknown) {
    super(message);
    this.name = 'GoPayError';
    this.status = status;
    this.errors = errors;
    this.rawBody = rawBody;

    // Set prototype explicitly for custom Error in ES5/ES6
    Object.setPrototypeOf(this, GoPayError.prototype);
  }

  public static fromResponse(status: number, body: unknown): GoPayError {
    let message = `GoPay API request failed with status ${status}`;
    let errorItems: GoPayErrorItem[] = [];

    if (body && typeof body === 'object') {
      const gopayBody = body as GoPayErrorResponseBody;
      if (Array.isArray(gopayBody.errors) && gopayBody.errors.length > 0) {
        errorItems = gopayBody.errors;
        const descriptions = errorItems
          .map((e) => `${e.field ? `[${e.field}] ` : ''}${e.message || e.description || e.error_name || `Code ${e.error_code}`}`)
          .join('; ');
        message = `GoPay API Error (${status}): ${descriptions}`;
      } else if (gopayBody.message || gopayBody.description) {
        message = `GoPay API Error (${status}): ${gopayBody.message || gopayBody.description}`;
      }
    }

    return new GoPayError(status, message, errorItems, body);
  }
}
