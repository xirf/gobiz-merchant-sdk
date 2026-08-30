import type { HttpClient } from '../http.js';
import type { CardDetailsResponse, DeleteCardResponse } from '../types/cards.js';

export class CardsService {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Inquires payment card details (expiration, brand, status, fingerprint).
   *
   * @see https://doc.gopay.com/#payment-card-inquiry
   */
  public async getCard(cardId: number | string): Promise<CardDetailsResponse> {
    return this.http.request<CardDetailsResponse>({
      method: 'GET',
      path: `/payments/cards/${cardId}`,
    });
  }

  /**
   * Deletes a saved payment card token.
   *
   * @see https://doc.gopay.com/#payment-card-deletion
   */
  public async deleteCard(cardId: number | string): Promise<DeleteCardResponse> {
    return this.http.request<DeleteCardResponse>({
      method: 'DELETE',
      path: `/payments/cards/${cardId}`,
    });
  }
}
