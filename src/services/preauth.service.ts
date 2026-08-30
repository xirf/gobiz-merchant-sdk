import type { HttpClient } from '../http.js';
import type {
  PartialCapturePayload,
  CaptureResponse,
  VoidAuthorizationResponse,
} from '../types/preauth.js';

export class PreauthorizationService {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Captures the full amount of a preauthorized payment.
   *
   * @see https://doc.gopay.com/#capturing-a-preauthorized-payment
   */
  public async capture(paymentId: number | string): Promise<CaptureResponse> {
    return this.http.request<CaptureResponse>({
      method: 'POST',
      path: `/payments/payment/${paymentId}/capture`,
      contentType: 'application/x-www-form-urlencoded',
    });
  }

  /**
   * Captures a partial amount of a preauthorized payment.
   *
   * @see https://doc.gopay.com/#partially-capturing-a-preauthorized-payment
   */
  public async partialCapture(
    paymentId: number | string,
    payload: number | PartialCapturePayload,
  ): Promise<CaptureResponse> {
    const body: PartialCapturePayload = typeof payload === 'number' ? { amount: payload } : payload;

    return this.http.request<CaptureResponse>({
      method: 'POST',
      path: `/payments/payment/${paymentId}/capture`,
      body,
    });
  }

  /**
   * Voids/cancels a preauthorized payment, releasing the held funds.
   *
   * @see https://doc.gopay.com/#voiding-a-preauthorized-payment
   */
  public async voidAuthorization(paymentId: number | string): Promise<VoidAuthorizationResponse> {
    return this.http.request<VoidAuthorizationResponse>({
      method: 'POST',
      path: `/payments/payment/${paymentId}/void-authorization`,
      contentType: 'application/x-www-form-urlencoded',
    });
  }
}
