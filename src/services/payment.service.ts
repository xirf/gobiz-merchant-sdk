import { BaseService } from './base.service.js';
import { GoBizScope } from '../constants/index.js';
import type {
  CreatePaymentTransactionRequest,
  CreatePaymentTransactionResponse,
  GetPaymentTransactionResponse,
} from '../types/payment.js';
import { GoBizError } from '../errors/gobiz-error.js';

export class PaymentService extends BaseService {
  /**
   * Create a dynamic QRIS payment transaction for an outlet.
   *
   * @param outletId - The Outlet ID where the transaction will be recorded
   * @param payload - Transaction details, items, customer info
   * @param idempotencyKey - Unique idempotency string (max 32 characters)
   */
  public async createTransaction(
    outletId: string,
    payload: CreatePaymentTransactionRequest,
    idempotencyKey?: string,
  ): Promise<CreatePaymentTransactionResponse> {
    if (!outletId) {
      throw new GoBizError('Outlet ID is required to create a payment transaction', 400);
    }

    return this.request<CreatePaymentTransactionResponse>({
      method: 'POST',
      path: `/integrations/payment/outlets/${outletId}/v2/transactions`,
      scope: GoBizScope.PAYMENT_TRANSACTION_WRITE,
      body: payload,
      idempotencyKey: idempotencyKey || this.generateIdempotencyKey(),
    });
  }

  /**
   * Get details and live status of a payment transaction.
   *
   * @param outletId - The Outlet ID
   * @param transactionId - The ID of the transaction
   */
  public async getTransaction(
    outletId: string,
    transactionId: string,
  ): Promise<GetPaymentTransactionResponse> {
    if (!outletId) {
      throw new GoBizError('Outlet ID is required to get a payment transaction', 400);
    }
    if (!transactionId) {
      throw new GoBizError('Transaction ID is required', 400);
    }

    return this.request<GetPaymentTransactionResponse>({
      method: 'GET',
      path: `/integrations/payment/outlets/${outletId}/v1/transactions/${transactionId}`,
      scope: GoBizScope.PAYMENT_TRANSACTION_READ,
    });
  }

  /**
   * Extract QR Code image URL from transaction response action list
   */
  public getQrCodeUrl(response: CreatePaymentTransactionResponse | GetPaymentTransactionResponse): string | null {
    if (response && Array.isArray(response.actions)) {
      const qrAction = response.actions.find((a) => a.name === 'generate-qr-code');
      if (qrAction && qrAction.url) {
        return qrAction.url;
      }
    }
    return null;
  }

  private generateIdempotencyKey(): string {
    return 'gb_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
}
