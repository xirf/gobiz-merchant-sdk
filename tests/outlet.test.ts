import { describe, it, expect, mock } from 'bun:test';
import { GoBiz } from '../src/client.js';
import { TEST_CONFIG } from './fixtures.js';

describe('GoBiz Outlet Management Service', () => {
  it('should get all linked outlets with pagination', async () => {
    let capturedUrl = '';

    const mockFetch = mock(async (url: string) => {
      if (url.includes('/oauth2/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid_mock_token',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'partner:outlet:read',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      capturedUrl = url;
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            outlets: [
              {
                id: 'G000012345',
                name: 'Warung Enak Jakarta',
                brand_name: 'Warung Enak',
                phone_number: '+6281234567890',
                status: 'ACTIVE',
              },
            ],
            page_info: {
              page: 1,
              page_size: 10,
              total_count: 1,
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = new GoBiz({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    const response = await client.getOutlets(1, 10);
    expect(response.outlets).toHaveLength(1);
    expect(response.outlets[0].id).toBe('G000012345');
    expect(capturedUrl).toContain('/integrations/partner/v1/linked-outlets?page=1&page_size=10');
  });

  it('should get single outlet details', async () => {
    const mockFetch = mock(async (url: string) => {
      if (url.includes('/oauth2/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid_mock_token',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'partner:outlet:read',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'G000012345',
            name: 'Warung Enak Jakarta',
            status: 'ACTIVE',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = new GoBiz({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    const outlet = await client.getOutlet('G000012345');
    expect(outlet.id).toBe('G000012345');
    expect(outlet.name).toBe('Warung Enak Jakarta');
  });
});
