import type { CurrencyType, StatementFormatType } from '../constants/enums.js';

export interface AccountStatementPayload {
  date_from: string; // YYYY-MM-DD
  date_to: string;   // YYYY-MM-DD
  goid: number | string;
  currency: CurrencyType;
  format: StatementFormatType;
}
