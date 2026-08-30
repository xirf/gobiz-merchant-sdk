import { describe, it, expect, mock } from 'bun:test';
import { GoBizPortal } from '../src/client.js';

describe('GoBizPortal Embedded Global Poller & Deduplication', () => {
  it('should deduplicate concurrent getTransactions calls into 1 single upstream fetch', async () => {
    let upstreamCallCount = 0;

    const mockFetch = mock(async (url: string) => {
      if (url.includes('/merchant-analytics/v2/merchants/transactions')) {
        upstreamCallCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return new Response(
          JSON.stringify([
            {
              id: 'tx_100',
              amount: 50012,
              status: 'SETTLEMENT',
              payment_type: 'QRIS',
              transaction_time: '2026-08-31T00:20:00Z',
            },
          ]),
          { status: 200 },
        );
      }
      return new Response('Not Found', { status: 404 });
    });

    const portal = new GoBizPortal({
      token: 'mock_token',
      merchantId: 'M123',
      pollIntervalMinMs: 1000,
      pollIntervalMaxMs: 2000,
      fetch: mockFetch as any,
    });

    // Fire 5 concurrent calls at the exact same moment
    const results = await Promise.all([
      portal.getTransactions(),
      portal.getTransactions(),
      portal.getTransactions(),
      portal.getTransactions(),
      portal.getTransactions(),
    ]);

    expect(results).toHaveLength(5);
    // Across 5 simultaneous caller requests, ONLY 1 HTTP call reached upstream
    expect(upstreamCallCount).toBe(1);
    expect(results[0][0].amount).toBe(50012);
  });

  it('should serve cached mutations when within the throttle window', async () => {
    let upstreamCallCount = 0;

    const mockFetch = mock(async () => {
      upstreamCallCount++;
      return new Response(
        JSON.stringify([
          {
            id: 'tx_101',
            amount: 25015,
            status: 'SETTLEMENT',
            payment_type: 'QRIS',
            transaction_time: '2026-08-31T00:20:00Z',
          },
        ]),
        { status: 200 },
      );
    });

    const portal = new GoBizPortal({
      token: 'mock_token',
      merchantId: 'M100',
      pollIntervalMinMs: 10000, // 10s
      pollIntervalMaxMs: 20000, // 20s
      fetch: mockFetch as any,
    });

    // First call: fetches from upstream
    await portal.checkSettlement(25015);
    expect(upstreamCallCount).toBe(1);

    // Second call immediately after: returns from cache without calling upstream!
    const cachedRes = await portal.checkSettlement(25015);
    expect(upstreamCallCount).toBe(1);
    expect(cachedRes.paid).toBe(true);
    expect(cachedRes.fromCache).toBe(true);
  });

  it('should watch payment and fire onPaid when settlement is detected', async () => {
    const mockFetch = mock(async () => {
      return new Response(
        JSON.stringify([
          {
            id: 'tx_999',
            amount: 75022,
            status: 'SETTLEMENT',
            payment_type: 'QRIS',
            transaction_time: '2026-08-31T00:22:00Z',
          },
        ]),
        { status: 200 },
      );
    });

    const portal = new GoBizPortal({
      token: 'mock_token',
      fetch: mockFetch as any,
    });

    let detectedTxId = '';

    portal.watchPayment(75022, (tx) => {
      detectedTxId = tx.id;
    });

    // Trigger check
    await portal.getTransactions({ force: true });
    expect(detectedTxId).toBe('tx_999');

    portal.stopPoller();
  });
});
