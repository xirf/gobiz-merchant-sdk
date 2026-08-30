import type { HttpClient } from '../http.js';
import type { GoPayConfig } from '../types/config.js';
import type { AccountStatementPayload } from '../types/statements.js';

export class AccountsService {
  private http: HttpClient;
  private config: GoPayConfig;

  constructor(http: HttpClient, config: GoPayConfig) {
    this.http = http;
    this.config = config;
  }

  /**
   * Generates and downloads an account statement.
   *
   * @see https://doc.gopay.com/#account-statement
   */
  public async getAccountStatement(payload: Partial<AccountStatementPayload> & { date_from: string; date_to: string; currency: AccountStatementPayload['currency']; format: AccountStatementPayload['format'] }): Promise<string> {
    const fullPayload: AccountStatementPayload = {
      ...payload,
      goid: payload.goid || this.config.goid,
    };

    return this.http.request<string>({
      method: 'POST',
      path: '/accounts/account-statement',
      body: fullPayload,
      rawResponse: true,
    });
  }
}
