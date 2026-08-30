import { BaseService } from './base.service.js';
import { GoBizScope } from '../constants/index.js';
import type { FoodCatalog } from '../types/food.js';
import { GoBizError } from '../errors/gobiz-error.js';

export class FoodService extends BaseService {
  /**
   * Sync/Push updated GoFood menu catalog for an outlet
   */
  public async syncMenu(outletId: string, catalog: FoodCatalog): Promise<any> {
    if (!outletId) {
      throw new GoBizError('Outlet ID is required', 400);
    }
    return this.request<any>({
      method: 'PUT',
      path: `/integrations/gofood/outlets/${outletId}/v1/catalogs`,
      scope: GoBizScope.GOFOOD_CATALOG_WRITE,
      body: catalog,
    });
  }

  /**
   * Mark a GoFood kitchen order as prepared/ready for driver pickup
   */
  public async markFoodReady(outletId: string, orderId: string): Promise<any> {
    if (!outletId || !orderId) {
      throw new GoBizError('Outlet ID and Order ID are required', 400);
    }
    return this.request<any>({
      method: 'POST',
      path: `/integrations/gofood/outlets/${outletId}/v1/orders/${orderId}/ready`,
      scope: GoBizScope.GOFOOD_ORDER_WRITE,
    });
  }

  /**
   * Accept an incoming GoFood order
   */
  public async acceptOrder(outletId: string, orderId: string): Promise<any> {
    if (!outletId || !orderId) {
      throw new GoBizError('Outlet ID and Order ID are required', 400);
    }
    return this.request<any>({
      method: 'POST',
      path: `/integrations/gofood/outlets/${outletId}/v1/orders/${orderId}/accept`,
      scope: GoBizScope.GOFOOD_ORDER_WRITE,
    });
  }

  /**
   * Get restaurant properties (opening hours, auto-accept status)
   */
  public async getOutletProperties(outletId: string): Promise<any> {
    if (!outletId) {
      throw new GoBizError('Outlet ID is required', 400);
    }
    return this.request<any>({
      method: 'GET',
      path: `/integrations/gofood/outlets/${outletId}/v1/properties`,
      scope: GoBizScope.GOFOOD_CATALOG_READ,
    });
  }

  /**
   * Get active promotions for an outlet
   */
  public async getPromotions(outletId: string): Promise<any> {
    if (!outletId) {
      throw new GoBizError('Outlet ID is required', 400);
    }
    return this.request<any>({
      method: 'GET',
      path: `/integrations/promo/outlets/${outletId}/v1/promos`,
      scope: GoBizScope.PROMO_FOOD_PROMO_READ,
    });
  }
}
