import type { CurrencyType, OperationResultType } from '../constants/enums.js';
import type { Item, AdditionalParam } from './common.js';

export interface CreateRecurrencePayload {
  amount: number;
  currency: CurrencyType;
  order_number: string;
  order_description?: string;
  items?: Item[];
  additional_params?: AdditionalParam[];
}

export interface CreateRecurrenceResponse {
  id: number;
  result: OperationResultType;
}

export interface VoidRecurrenceResponse {
  id: number;
  result: OperationResultType;
}
