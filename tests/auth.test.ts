import { describe, it, expect, mock } from 'bun:test';
import { GoAuthService } from '../src/services/auth.service.js';
import { GoBizScope } from '../src/constants/index.js';
import { TEST_CONFIG } from './fixtures.js';

describe('GoBiz GoAuth Authentication Service', () => {
  it('should format HTTP Basic auth header correctly and fetch token', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody = '';

    const mockFetch = mock(async (url: string, init: any) => {
      capturedUrl = url;
      capturedHeaders = init.headers;
      capturedBody = init.body;
      return new Response(
        JSON.stringify({
          access_token: 'mock_token_123',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: GoBizScope.PAYMENT_TRANSACTION_WRITE,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const auth = new GoAuthService({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    const token = await auth.getAccessToken(GoBizScope.PAYMENT_TRANSACTION_WRITE);

    expect(token).toBe('mock_token_123');
    expect(capturedUrl).toBe('https://integration-goauth.gojekapi.com/oauth2/token');

    const expectedBasicAuth = `Basic ${Buffer.from(
      `${TEST_CONFIG.clientId}:${TEST_CONFIG.clientSecret}`,
    ).toString('base64')}`;

    expect(capturedHeaders.Authorization).toBe(expectedBasicAuth);
    expect(capturedBody).toContain('grant_type=client_credentials');
    expect(capturedBody).toContain(`scope=${encodeURIComponent(GoBizScope.PAYMENT_TRANSACTION_WRITE)}`);
  });

  it('should cache access token and reuse it across multiple calls', async () => {
    let callCount = 0;
    const mockFetch = mock(async () => {
      callCount++;
      return new Response(
        JSON.stringify({
          access_token: 'cached_token_xyz',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: GoBizScope.PAYMENT_TRANSACTION_WRITE,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const auth = new GoAuthService({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    const token1 = await auth.getAccessToken(GoBizScope.PAYMENT_TRANSACTION_WRITE);
    const token2 = await auth.getAccessToken(GoBizScope.PAYMENT_TRANSACTION_WRITE);
    const token3 = await auth.getAccessToken(GoBizScope.PAYMENT_TRANSACTION_WRITE);

    expect(token1).toBe('cached_token_xyz');
    expect(token2).toBe('cached_token_xyz');
    expect(token3).toBe('cached_token_xyz');
    expect(callCount).toBe(1);
  });

  it('should handle concurrent token requests without duplicate HTTP calls', async () => {
    let callCount = 0;
    const mockFetch = mock(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return new Response(
        JSON.stringify({
          access_token: 'deduped_token_777',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: GoBizScope.PARTNER_OUTLET_READ,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const auth = new GoAuthService({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    const results = await Promise.all([
      auth.getAccessToken(GoBizScope.PARTNER_OUTLET_READ),
      auth.getAccessToken(GoBizScope.PARTNER_OUTLET_READ),
      auth.getAccessToken(GoBizScope.PARTNER_OUTLET_READ),
    ]);

    expect(results).toEqual(['deduped_token_777', 'deduped_token_777', 'deduped_token_777']);
    expect(callCount).toBe(1);
  });
});
