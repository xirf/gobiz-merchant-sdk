import type {
  CurrencyType,
  PaymentInstrumentType,
  BankSwiftType,
} from '../constants/enums.js';

export interface MethodImage {
  normal?: string;
  large?: string;
}

export interface MethodLabel {
  [lang: string]: string;
}

export interface EnabledSwiftItem {
  swift: BankSwiftType | string;
  label: MethodLabel;
  image?: MethodImage;
  isOnline: boolean;
}

export interface PaymentInstrumentGroup {
  group: string;
  label: MethodLabel;
}

export interface EnabledPaymentInstrument {
  paymentInstrument: PaymentInstrumentType;
  label: MethodLabel;
  image?: MethodImage;
  group?: string;
  enabledSwifts?: EnabledSwiftItem[];
}

export interface PaymentInstrumentsCurrencyResponse {
  groups?: { [key: string]: PaymentInstrumentGroup };
  enabledPaymentInstruments: EnabledPaymentInstrument[];
}

export interface EnabledSwiftAllCurrencies extends EnabledSwiftItem {
  currencies: {
    [currency in CurrencyType]?: {
      isOnline: boolean;
    };
  };
}

export interface EnabledPaymentInstrumentAllCurrencies {
  paymentInstrument: PaymentInstrumentType;
  label: MethodLabel;
  image?: MethodImage;
  group?: string;
  currencies: CurrencyType[];
  enabledSwifts?: {
    [swift: string]: EnabledSwiftAllCurrencies;
  };
}

export interface AllPaymentInstrumentsResponse {
  groups?: { [key: string]: PaymentInstrumentGroup };
  enabledPaymentInstruments: {
    [instrument in PaymentInstrumentType]?: EnabledPaymentInstrumentAllCurrencies;
  };
}
