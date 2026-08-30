import type { HttpClient } from '../http.js';
import type { GoPayConfig } from '../types/config.js';
import type { CurrencyType, LanguageType } from '../constants/enums.js';
import type {
  PaymentInstrumentsCurrencyResponse,
  AllPaymentInstrumentsResponse,
} from '../types/methods.js';

export interface GetMethodsOptions {
  goid?: number | string;
  lang?: LanguageType | string;
}

export class MethodsService {
  private http: HttpClient;
  private config: GoPayConfig;

  constructor(http: HttpClient, config: GoPayConfig) {
    this.http = http;
    this.config = config;
  }

  /**
   * Returns available payment methods and SWIFTs for a specific currency.
   *
   * @see https://doc.gopay.com/#available-payment-methods-for-a-currency
   */
  public async getPaymentInstruments(
    currency: CurrencyType,
    options?: GetMethodsOptions,
  ): Promise<PaymentInstrumentsCurrencyResponse> {
    const goid = options?.goid || this.config.goid;
    return this.http.request<PaymentInstrumentsCurrencyResponse>({
      method: 'GET',
      path: `/eshops/eshop/${goid}/payment-instruments/${currency}`,
      query: options?.lang ? { lang: options.lang } : undefined,
    });
  }

  /**
   * Returns all available payment methods across all currencies.
   *
   * @see https://doc.gopay.com/#all-available-payment-methods
   */
  public async getAllPaymentInstruments(
    options?: GetMethodsOptions,
  ): Promise<AllPaymentInstrumentsResponse> {
    const goid = options?.goid || this.config.goid;
    return this.http.request<AllPaymentInstrumentsResponse>({
      method: 'GET',
      path: `/eshops/eshop/${goid}/payment-instruments`,
      query: options?.lang ? { lang: options.lang } : undefined,
    });
  }
}
