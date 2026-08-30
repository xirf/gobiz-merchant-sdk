import { GoBiz, GoBizPortal } from '@xirf/gobiz-merchant-sdk';
import type { H3Event } from 'h3';

let sharedPortalInstance: GoBizPortal | null = null;
const mockMutationsHistory: any[] = [];

export function isMockMode(event: H3Event): boolean {
  const reqHeaders = getHeaders(event);
  const clientId = (reqHeaders['x-gobiz-client-id'] as string) || '';
  const mockHeader = reqHeaders['x-gobiz-mock-mode'];

  if (mockHeader === 'true') return true;
  if (mockHeader === 'false') return false;

  // Auto-enable mock simulation if using demo placeholder credentials
  return !clientId || clientId.startsWith('demo_') || clientId === 'test_client_id_gobiz_123';
}

export function recordMockMutation(amount: number, orderId?: string) {
  const existing = mockMutationsHistory.find(m => m.amount === amount);
  if (existing) return existing;

  const item = {
    id: 'tx_mock_' + Date.now().toString(36),
    order_id: orderId || 'ORDER-' + Math.floor(Math.random() * 10000),
    amount,
    payment_type: 'QRIS',
    status: 'SETTLEMENT',
    transaction_time: new Date().toISOString(),
    settlement_time: new Date().toISOString(),
  };
  mockMutationsHistory.unshift(item);
  if (mockMutationsHistory.length > 20) {
    mockMutationsHistory.pop();
  }
  return item;
}

export function getMockMutations() {
  if (mockMutationsHistory.length === 0) {
    return [
      {
        id: 'tx_mock_001',
        order_id: 'ORDER-101',
        amount: 50012,
        payment_type: 'QRIS',
        status: 'SETTLEMENT',
        transaction_time: new Date(Date.now() - 300000).toISOString(),
        settlement_time: new Date(Date.now() - 280000).toISOString(),
      },
      {
        id: 'tx_mock_002',
        order_id: 'ORDER-102',
        amount: 25005,
        payment_type: 'GOPAY',
        status: 'SETTLEMENT',
        transaction_time: new Date(Date.now() - 900000).toISOString(),
        settlement_time: new Date(Date.now() - 890000).toISOString(),
      },
    ];
  }
  return mockMutationsHistory;
}

export function getGoBizClient(event: H3Event): GoBiz {
  const reqHeaders = getHeaders(event);

  const clientId = (reqHeaders['x-gobiz-client-id'] as string) || process.env.GOBIZ_CLIENT_ID || 'demo_client_id_gobiz';
  const clientSecret = (reqHeaders['x-gobiz-client-secret'] as string) || process.env.GOBIZ_CLIENT_SECRET || 'demo_client_secret_gobiz';
  const outletId = (reqHeaders['x-gobiz-outlet-id'] as string) || process.env.GOBIZ_OUTLET_ID || 'G000012345';
  const isProduction = reqHeaders['x-gobiz-is-production'] === 'true';

  return new GoBiz({
    clientId,
    clientSecret,
    outletId,
    isProductionMode: isProduction,
  });
}

/**
 * Returns a shared singleton GoBizPortal instance on the server.
 * This guarantees that only 1 single poller / throttler runs across all client connections.
 */
export function getSharedGoBizPortal(event?: H3Event): GoBizPortal {
  if (!sharedPortalInstance) {
    sharedPortalInstance = new GoBizPortal({
      pollIntervalMinMs: 30000, // 30s
      pollIntervalMaxMs: 60000, // 60s
    });
  }

  if (event) {
    const reqHeaders = getHeaders(event);
    const token = reqHeaders['x-gobiz-portal-token'] as string;
    const email = reqHeaders['x-gobiz-portal-email'] as string;
    const password = reqHeaders['x-gobiz-portal-password'] as string;

    if (token) {
      sharedPortalInstance.setCookieToken(token);
    } else if (email && password) {
      sharedPortalInstance.config.email = email;
      sharedPortalInstance.config.password = password;
    }
  }

  return sharedPortalInstance;
}
