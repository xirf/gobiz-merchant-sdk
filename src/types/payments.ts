import type {
  CurrencyType,
  LanguageType,
  PaymentStateType,
  OperationResultType,
  QrCodeFormatType,
} from '../constants/enums.js';
import type {
  Target,
  Payer,
  Callback,
  Item,
  AdditionalParam,
  Recurrence,
  Preauthorization,
} from './common.js';

export interface CreatePaymentPayload {
  amount: number;
  currency: CurrencyType;
  order_number: string;
  order_description?: string;
  target?: Target; // Automatically injected from config if omitted
  payer: Payer;
  callback: Callback;
  items?: Item[];
  additional_params?: AdditionalParam[];
  lang?: LanguageType;
  preauthorization?: boolean;
  recurrence?: Recurrence;
}

export interface PaymentStatusResponse {
  id: number;
  order_number: string;
  state: PaymentStateType;
  sub_state?: string;
  amount: number;
  currency: CurrencyType;
  payer: Payer;
  target: Target;
  additional_params?: AdditionalParam[];
  lang?: LanguageType;
  gw_url?: string;
  recurrence?: Recurrence;
  preauthorization?: Preauthorization;
  order_description?: string;
  items?: Item[];
}

export interface RefundPaymentPayload {
  amount: number;
  items?: Item[];
}

export interface RefundPaymentResponse {
  id: number;
  result: OperationResultType;
}

export interface RefundHistoryItem {
  amount: number;
  currency: CurrencyType;
  date: string;
  reason?: string;
}

export interface QrPaymentRecipient {
  name?: string;
  bank_account?: {
    local?: {
      account_number?: string;
      bank_code?: string;
    };
    international?: {
      iban?: string;
      bic?: string;
      reference?: string;
    };
  };
}

export interface QrPaymentResponse {
  amount: number;
  currency: CurrencyType;
  qr_code: {
    spayd?: string;
    paybysquare?: string;
    sepa?: string;
    mnb_qr?: string;
    [key: string]: string | undefined;
  } | string;
  recipient?: QrPaymentRecipient;
}
