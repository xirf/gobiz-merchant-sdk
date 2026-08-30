import type { HttpClient } from '../http.js';
import type {
  CreateRecurrencePayload,
  CreateRecurrenceResponse,
  VoidRecurrenceResponse,
} from '../types/recurring.js';

export class RecurringService {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Creates a subsequent recurrent payment on an existing recurring payment master.
   *
   * @see https://doc.gopay.com/#creating-a-recurrence
   */
  public async createRecurrence(
    paymentId: number | string,
    payload: CreateRecurrencePayload,
  ): Promise<CreateRecurrenceResponse> {
    return this.http.request<CreateRecurrenceResponse>({
      method: 'POST',
      path: `/payments/payment/${paymentId}/create-recurrence`,
      body: payload,
    });
  }

  /**
   * Voids/cancels a recurring payment subscription.
   *
   * @see https://doc.gopay.com/#void-a-recurring-payment
   */
  public async voidRecurrence(paymentId: number | string): Promise<VoidRecurrenceResponse> {
    return this.http.request<VoidRecurrenceResponse>({
      method: 'POST',
      path: `/payments/payment/${paymentId}/void-recurrence`,
      contentType: 'application/x-www-form-urlencoded',
    });
  }
}
