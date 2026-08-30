import type { HttpClient } from '../http.js';
import type { GoPayConfig } from '../types/config.js';
import type { QrCodeFormatType } from '../constants/enums.js';
import type {
  CreatePaymentPayload,
  PaymentStatusResponse,
  RefundPaymentPayload,
  RefundPaymentResponse,
  RefundHistoryItem,
  QrPaymentResponse,
} from '../types/payments.js';

export class PaymentsService {
  private http: HttpClient;
  private config: GoPayConfig;

  constructor(http: HttpClient, config: GoPayConfig) {
    this.http = http;
    this.config = config;
  }

  /**
   * Creates a standard, recurring, or preauthorized payment.
   * Target goid is automatically injected if omitted.
   *
   * @see https://doc.gopay.com/#payment-creation
   */
  public async create(payload: CreatePaymentPayload): Promise<PaymentStatusResponse> {
    const fullPayload: CreatePaymentPayload = {
      ...payload,
      target: payload.target || {
        type: 'ACCOUNT',
        goid: this.config.goid,
      },
    };

    return this.http.request<PaymentStatusResponse>({
      method: 'POST',
      path: '/payments/payment',
      body: fullPayload,
    });
  }

  /**
   * Inquires the current status and detailed parameters of a payment.
   *
   * @see https://doc.gopay.com/#payment-inquiry
   */
  public async getStatus(paymentId: number | string): Promise<PaymentStatusResponse> {
    return this.http.request<PaymentStatusResponse>({
      method: 'GET',
      path: `/payments/payment/${paymentId}`,
    });
  }

  /**
   * Refunds a payment (in full or partial amount).
   *
   * @see https://doc.gopay.com/#payment-refund
   */
  public async refund(
    paymentId: number | string,
    payload: number | RefundPaymentPayload,
  ): Promise<RefundPaymentResponse> {
    const body: RefundPaymentPayload = typeof payload === 'number' ? { amount: payload } : payload;

    return this.http.request<RefundPaymentResponse>({
      method: 'POST',
      path: `/payments/payment/${paymentId}/refund`,
      body,
    });
  }

  /**
   * Retrieves the history of refunds for a specific payment.
   *
   * @see https://doc.gopay.com/#history-of-refunds
   */
  public async getRefunds(paymentId: number | string): Promise<RefundHistoryItem[]> {
    return this.http.request<RefundHistoryItem[]>({
      method: 'GET',
      path: `/payments/payment/${paymentId}/refunds`,
    });
  }

  /**
   * Retrieves the QR code payment details for a payment.
   *
   * @param paymentId Payment identifier
   * @param format Optional format ('png', 'svg', 'html')
   */
  public async getQrPayment(
    paymentId: number | string,
    format?: QrCodeFormatType | string,
  ): Promise<QrPaymentResponse> {
    return this.http.request<QrPaymentResponse>({
      method: 'GET',
      path: `/payments/payment/${paymentId}/qr-payment`,
      query: format ? { format } : undefined,
    });
  }
}
