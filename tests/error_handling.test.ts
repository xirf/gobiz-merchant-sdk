import { describe, it, expect, mock } from 'bun:test';
import { GoBiz } from '../src/client.js';
import { GoBizError } from '../src/errors/gobiz-error.js';
import { TEST_CONFIG, sampleTransactionRequest } from './fixtures.js';

describe('GoBiz Error Handling & Parser', () => {
  it('should parse GoBiz standard error response with message_title and message', async () => {
    const mockFetch = mock(async (url: string) => {
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

      return new Response(
        JSON.stringify({
          success: false,
          errors: [
            {
              message_title: 'UnregisteredOutlet',
              message: 'The outlet is not yet registered for integration. Please contact the support team.',
            },
          ],
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = new GoBiz({
      ...TEST_CONFIG,
      fetch: mockFetch as any,
    });

    try {
      await client.createPayment('INVALID_OUTLET', sampleTransactionRequest);
      expect(true).toBe(false); // should not reach
    } catch (err: any) {
      expect(err).toBeInstanceOf(GoBizError);
      expect(err.status).toBe(404);
      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].message_title).toBe('UnregisteredOutlet');
      expect(err.message).toContain('[UnregisteredOutlet]');
    }
  });

  it('should validate mandatory client credentials on initialization', () => {
    expect(() => {
      new GoBiz({ clientId: '', clientSecret: '' });
    }).toThrow('clientId and clientSecret are mandatory');
  });
});
