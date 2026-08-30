import { describe, it, expect } from 'bun:test';
import { buildDynamicQris, crc16Ccitt } from '../src/utils/qris.js';
import { generateWebhookSignature, verifyWebhookSignature } from '../src/utils/security.js';

describe('QRIS Dynamic Generator & CRC16', () => {
  const sampleStaticQris =
    '00020101021126610014COM.GO-JEK.WWW01189360091430438058080210G7641517890303UMI51440014ID.CO.QRIS.WWW0215ID10190450190010303UMI5204581253033605802ID5907GoBiz6015Jakarta61051022062070703A0163045E1B';

  it('should compute valid 4-digit CRC16 checksum', () => {
    const payload = '0002010102125802ID6304';
    const crc = crc16Ccitt(payload);
    expect(crc).toHaveLength(4);
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
  });

  it('should convert static QRIS (010211) to dynamic QRIS (010212) with Tag 54 amount', () => {
    const dynamicQris = buildDynamicQris(sampleStaticQris, 50012);

    expect(dynamicQris).toContain('010212'); // dynamic indicator
    expect(dynamicQris).not.toContain('010211'); // static removed
    expect(dynamicQris).toContain('540550012'); // Tag 54, len 05, value 50012
    expect(dynamicQris).toContain('5802ID');

    // Verify CRC tag at end
    const last8 = dynamicQris.slice(-8);
    expect(last8.startsWith('6304')).toBe(true);
    const checksum = last8.slice(4);
    const recalculated = crc16Ccitt(dynamicQris.slice(0, -4));
    expect(checksum).toBe(recalculated);
  });

  it('should sign and verify webhook signatures with constant-time equality', () => {
    const secret = 'my_super_secret_webhook_key_123';
    const payload = {
      event: 'payment.paid',
      trxId: 'TRX-1001',
      amount: 50000,
      amountToPay: 50015,
      uniqueCode: 15,
    };

    const signature = generateWebhookSignature(secret, payload);
    expect(typeof signature).toBe('string');
    expect(signature).toHaveLength(64); // 64 chars hex

    const isValid = verifyWebhookSignature(secret, payload, signature);
    expect(isValid).toBe(true);

    const isTampered = verifyWebhookSignature(secret, { ...payload, amount: 99999 }, signature);
    expect(isTampered).toBe(false);

    const isWrongSecret = verifyWebhookSignature('wrong_secret', payload, signature);
    expect(isWrongSecret).toBe(false);
  });
});
