import { describe, it, expect, mock } from 'bun:test';
import { GoBiz } from '../src/client.js';
import { TEST_CONFIG, sampleFoodCatalog } from './fixtures.js';

describe('GoBiz GoFood Integration Service', () => {
  it('should push and sync menu catalog', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    const mockFetch = mock(async (url: string, init: any) => {
      if (url.includes('/oauth2/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid_mock_token',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'gofood:catalog:write',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      capturedUrl = url;
      capturedMethod = init.method;
      return new Response(
        JSON.stringify({
          success: true,
          data: { status: 'CATALOG_SYNCED' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = new GoBiz({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    const res = await client.food.syncMenu('G000012345', sampleFoodCatalog);
    expect(res.status).toBe('CATALOG_SYNCED');
    expect(capturedUrl).toContain('/integrations/gofood/outlets/G000012345/v1/catalogs');
    expect(capturedMethod).toBe('PUT');
  });

  it('should mark order as ready in kitchen', async () => {
    let capturedUrl = '';

    const mockFetch = mock(async (url: string) => {
      if (url.includes('/oauth2/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid_mock_token',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'gofood:order:write',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      capturedUrl = url;
      return new Response(
        JSON.stringify({
          success: true,
          data: { order_id: 'GF-999', status: 'PREPARED' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = new GoBiz({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    const res = await client.markOrderReady('G000012345', 'GF-999');
    expect(res.status).toBe('PREPARED');
    expect(capturedUrl).toContain('/integrations/gofood/outlets/G000012345/v1/orders/GF-999/ready');
  });
});
