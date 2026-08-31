import { describe, it, expect, mock } from 'bun:test';
import { GoBizPortal } from '../src/client.js';

describe('GoBizPortal Direct Integration', () => {
  const sampleStaticQris =
    '00020101021126610014COM.GO-JEK.WWW01189360091430438058080210G7641517890303UMI51440014ID.CO.QRIS.WWW0215ID10190450190010303UMI5204581253033605802ID5907GoBiz6015Jakarta61051022062070703A0163045E1B';

  it('should authenticate using password flow', async () => {
    let tokenRequested = false;

    const mockFetch = mock(async (url: string, init: any) => {
      const body = JSON.parse(init.body);

      if (url.includes('/goid/token')) {
        tokenRequested = true;
        expect(body.client_id).toBe('go-biz-web-new');
        expect(body.grant_type).toBe('password');
        expect(body.data.email).toBe('merchant@example.com');
        expect(body.data.password).toBe('mypassword123');
        return new Response(
          JSON.stringify({
            access_token: 'portal_mock_access_token_123',
            token_type: 'Bearer',
          }),
          { status: 201 },
        );
      }

      return new Response('Not Found', { status: 404 });
    });

    const portal = new GoBizPortal({
      authMethod: 'password',
      email: 'merchant@example.com',
      password: 'mypassword123',
      fetch: mockFetch as any,
    });

    const token = await portal.getAccessToken();
    expect(token).toBe('portal_mock_access_token_123');
    expect(tokenRequested).toBe(true);
  });

  it('should authenticate using cookie access token without login API call', async () => {
    const portal = new GoBizPortal({
      authMethod: 'cookie',
      token: 'cookie_extracted_token_abc',
    });

    const token = await portal.getAccessToken();
    expect(token).toBe('cookie_extracted_token_abc');
  });

  it('should generate dynamic QRIS payments with sequential unique code', () => {
    const portal = new GoBizPortal({
      staticQris: sampleStaticQris,
      uniqueCodeMin: 1,
      uniqueCodeMax: 3,
    });

    const p1 = portal.createDynamicPayment({ amount: 10000 });
    expect(p1.uniqueCode).toBe(1);
    expect(p1.amountToPay).toBe(10001);
    expect(p1.qrisString).toContain('540510001');

    const p2 = portal.createDynamicPayment({ amount: 10000 });
    expect(p2.uniqueCode).toBe(2);
    expect(p2.amountToPay).toBe(10002);
    expect(p2.qrisString).toContain('540510002');

    const p3 = portal.createDynamicPayment({ amount: 10000 });
    expect(p3.uniqueCode).toBe(3);
    expect(p3.amountToPay).toBe(10003);

    // Cursor wrap-around
    const p4 = portal.createDynamicPayment({ amount: 10000 });
    expect(p4.uniqueCode).toBe(1);
    expect(p4.amountToPay).toBe(10001);
  });

  it('should check mutation settlement and detect payment match', async () => {
    const mockFetch = mock(async (url: string) => {
      if (url.includes('/merchant-analytics/v2/merchants/transactions')) {
        return new Response(
          JSON.stringify([
            {
              id: 'tx_mutasi_1',
              amount: 50012,
              status: 'SETTLEMENT',
              payment_type: 'QRIS',
              transaction_time: '2026-08-31T00:05:00Z',
              settlement_time: '2026-08-31T00:05:30Z',
            },
          ]),
          { status: 200 },
        );
      }
      return new Response('Not Found', { status: 404 });
    });

    const portal = new GoBizPortal({
      token: 'mock_token',
      merchantId: 'M12345',
      fetch: mockFetch as any,
    });

    const checkSuccess = await portal.checkSettlement(50012);
    expect(checkSuccess.paid).toBe(true);
    expect(checkSuccess.transaction?.id).toBe('tx_mutasi_1');

    const checkNotFound = await portal.checkSettlement(99999);
    expect(checkNotFound.paid).toBe(false);
  });
});
