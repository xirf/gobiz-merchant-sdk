import type { GoBizConfig } from './types/common.js';
import { GoAuthService } from './services/auth.service.js';
import { PaymentService } from './services/payment.service.js';
import { OutletService } from './services/outlet.service.js';
import { FoodService } from './services/food.service.js';
import { GoBizPortalService } from './services/portal.service.js';
import type { GoBizPortalConfig } from './types/portal.js';
import type {
  CreatePaymentTransactionRequest,
  CreatePaymentTransactionResponse,
  GetPaymentTransactionResponse,
} from './types/payment.js';
import type { LinkedOutletsResponse, OutletInfo } from './types/outlet.js';
import { GoBizError } from './errors/gobiz-error.js';

export class GoBiz {
  public readonly config: Readonly<GoBizConfig>;
  public readonly auth: GoAuthService;
  public readonly payments: PaymentService;
  public readonly outlets: OutletService;
  public readonly food: FoodService;

  constructor(config: GoBizConfig) {
    if (!config.clientId || !config.clientSecret) {
      throw new GoBizError('clientId and clientSecret are mandatory to initialize GoBiz SDK', 400);
    }

    this.config = Object.freeze({
      timeout: 30000,
      isProductionMode: false,
      ...config,
    });

    this.auth = new GoAuthService(this.config);
    this.payments = new PaymentService(this.config, this.auth);
    this.outlets = new OutletService(this.config, this.auth);
    this.food = new FoodService(this.config, this.auth);
  }

  // --- Convenience Shortcuts ---

  /**
   * Create dynamic QRIS payment transaction (Open API)
   */
  public async createPayment(
    outletId: string | undefined = this.config.outletId,
    payload: CreatePaymentTransactionRequest,
    idempotencyKey?: string,
  ): Promise<CreatePaymentTransactionResponse> {
    if (!outletId) {
      throw new GoBizError('Outlet ID must be provided either in config or method call', 400);
    }
    return this.payments.createTransaction(outletId, payload, idempotencyKey);
  }

  /**
   * Inquire payment transaction status (Open API)
   */
  public async getPayment(
    outletId: string | undefined = this.config.outletId,
    transactionId: string,
  ): Promise<GetPaymentTransactionResponse> {
    if (!outletId) {
      throw new GoBizError('Outlet ID must be provided either in config or method call', 400);
    }
    return this.payments.getTransaction(outletId, transactionId);
  }

  /**
   * List all linked outlets (Open API)
   */
  public async getOutlets(page?: number, pageSize?: number): Promise<LinkedOutletsResponse> {
    return this.outlets.getAllLinkedOutlets(page, pageSize);
  }

  /**
   * Get single outlet detail (Open API)
   */
  public async getOutlet(outletId: string): Promise<OutletInfo> {
    return this.outlets.getOutlet(outletId);
  }

  /**
   * Mark GoFood order as ready in kitchen
   */
  public async markOrderReady(outletId: string | undefined = this.config.outletId, orderId: string): Promise<any> {
    if (!outletId) {
      throw new GoBizError('Outlet ID must be provided either in config or method call', 400);
    }
    return this.food.markFoodReady(outletId, orderId);
  }

  /**
   * Get Active API Base URL
   */
  public getApiBaseUrl(): string {
    return this.auth.getApiBaseUrl();
  }

  /**
   * Get Active OAuth Base URL
   */
  public getOAuthBaseUrl(): string {
    return this.auth.getOAuthBaseUrl();
  }

  /**
   * Factory method to create a GoBizPortal instance for direct portal login & QRIS generation
   */
  public static createPortal(config: GoBizPortalConfig = {}): GoBizPortalService {
    return new GoBizPortalService(config);
  }
}

export const GoBizPortal = GoBizPortalService;
