import { BaseService } from './base.service.js';
import { GoBizScope } from '../constants/index.js';
import type { LinkedOutletsResponse, OutletInfo, LinkOutletRequest } from '../types/outlet.js';
import { GoBizError } from '../errors/gobiz-error.js';

export class OutletService extends BaseService {
  /**
   * Get list of all linked merchant outlets
   */
  public async getAllLinkedOutlets(page?: number, pageSize?: number): Promise<LinkedOutletsResponse> {
    return this.request<LinkedOutletsResponse>({
      method: 'GET',
      path: '/integrations/partner/v1/linked-outlets',
      scope: GoBizScope.PARTNER_OUTLET_READ,
      queryParams: {
        page,
        page_size: pageSize,
      },
    });
  }

  /**
   * Get detailed information about a specific outlet
   */
  public async getOutlet(outletId: string): Promise<OutletInfo> {
    if (!outletId) {
      throw new GoBizError('Outlet ID is required', 400);
    }
    return this.request<OutletInfo>({
      method: 'GET',
      path: `/integrations/partner/outlets/${outletId}/v1`,
      scope: GoBizScope.PARTNER_OUTLET_READ,
    });
  }

  /**
   * Get authenticated outlet information based on the current access token
   */
  public async getTokenInfo(): Promise<OutletInfo> {
    return this.request<OutletInfo>({
      method: 'GET',
      path: '/integrations/partner/v1/token-info',
      scope: GoBizScope.PARTNER_OUTLET_READ,
    });
  }

  /**
   * Link an outlet to partner integration
   */
  public async linkOutlet(payload: LinkOutletRequest): Promise<any> {
    return this.request<any>({
      method: 'PUT',
      path: '/integrations/partner/v1/outlet-link',
      scope: GoBizScope.PARTNER_OUTLET_WRITE,
      body: payload,
    });
  }

  /**
   * Unlink an outlet from partner integration
   */
  public async unlinkOutlet(payload: LinkOutletRequest): Promise<any> {
    return this.request<any>({
      method: 'DELETE',
      path: '/integrations/partner/v1/outlet-link',
      scope: GoBizScope.PARTNER_OUTLET_WRITE,
      body: payload,
    });
  }
}
