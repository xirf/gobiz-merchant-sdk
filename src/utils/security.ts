import crypto from 'node:crypto';

/**
 * Generates an HMAC-SHA256 signature for webhook payloads
 */
export function generateWebhookSignature(secret: string, payload: string | object): string {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(content, 'utf8').digest('hex');
}

/**
 * Verifies if an incoming webhook signature matches the payload using constant-time comparison
 */
export function verifyWebhookSignature(secret: string, payload: string | object, signature: string): boolean {
  if (!signature || typeof signature !== 'string') return false;
  const expected = generateWebhookSignature(secret, payload);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
