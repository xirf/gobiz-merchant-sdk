import { describe, it, expect, mock } from 'bun:test';
import { GoBiz } from '../src/client.js';
import { TEST_CONFIG, sampleTransactionRequest } from './fixtures.js';

describe('GoBiz Payment Service (QRIS)', () => {
  it('should create QRIS payment transaction with idempotency key', async () => {
    let capturedPath = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any;

    const mockFetch = mock(async (url: string, init: any) => {
      if (url.includes('/oauth2/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid_mock_token',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'payment:transaction:write',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      capturedPath = url;
      capturedHeaders = init.headers;
      capturedBody = JSON.parse(init.body);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            outlet: {
              id: 'G000012345',
              pop_id: 'pop-uuid-1234',
            },
            transaction: {
              id: 'tx-uuid-5678',
              payment_type: 'qris',
              status: 'pending',
              qris_string: '00020101021226610014COM.GO-JEK.WWW...',
              order_id: sampleTransactionRequest.transaction_details.order_id,
              gross_amount: 50000,
              currency: 'IDR',
              created_at: '2026-08-30T16:00:00Z',
              settlement_at: null,
            },
            actions: [
              {
                name: 'generate-qr-code',
                method: 'GET',
                url: 'https://api.partner-sandbox.gobiz.co.id/transactions/tx-uuid-5678/qr-code',
              },
            ],
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = new GoBiz({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    const response = await client.createPayment('G000012345', sampleTransactionRequest, 'CUSTOM_IDEM_KEY_123');

    expect(response.transaction.id).toBe('tx-uuid-5678');
    expect(response.transaction.status).toBe('pending');
    expect(response.transaction.gross_amount).toBe(50000);
    expect(response.transaction.qris_string).toContain('COM.GO-JEK.WWW');
    expect(capturedPath).toContain('/integrations/payment/outlets/G000012345/v2/transactions');
    expect(capturedHeaders['Idempotency-Key']).toBe('CUSTOM_IDEM_KEY_123');
    expect(capturedHeaders.Authorization).toBe('Bearer valid_mock_token');
    expect(capturedBody.payment_type).toBe('qris');

    // Test QR URL extractor
    const qrUrl = client.payments.getQrCodeUrl(response);
    expect(qrUrl).toBe('https://api.partner-sandbox.gobiz.co.id/transactions/tx-uuid-5678/qr-code');
  });

  it('should get transaction status and details', async () => {
    const mockFetch = mock(async (url: string) => {
      if (url.includes('/oauth2/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid_mock_token',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'payment:transaction:read',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            outlet: { id: 'G000012345' },
            transaction: {
              id: 'tx-uuid-5678',
              payment_type: 'qris',
              status: 'settlement',
              qris_string: '00020101021226610014COM.GO-JEK.WWW...',
              order_id: 'ORDER-TEST-001',
              gross_amount: 50000,
              currency: 'IDR',
              settlement_at: '2026-08-30T16:05:00Z',
            },
            actions: [],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = new GoBiz({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    const result = await client.getPayment('G000012345', 'tx-uuid-5678');
    expect(result.transaction.status).toBe('settlement');
    expect(result.transaction.settlement_at).toBe('2026-08-30T16:05:00Z');
  });
});
