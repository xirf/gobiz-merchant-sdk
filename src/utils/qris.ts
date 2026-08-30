/**
 * CRC16-CCITT (0x1021) table-based calculation with zero dependencies
 */
const CRC_TABLE = new Uint16Array(256);

// Precompute CRC16-CCITT lookup table (polynomial 0x1021)
for (let i = 0; i < 256; i++) {
  let curr = i << 8;
  for (let j = 0; j < 8; j++) {
    curr = (curr & 0x8000) !== 0 ? (curr << 1) ^ 0x1021 : curr << 1;
  }
  CRC_TABLE[i] = curr & 0xffff;
}

/**
 * Calculates uppercase 4-character hex CRC16-CCITT checksum of a payload string
 */
export function crc16Ccitt(payload: string): string {
  let crc = 0xffff;
  const bytes = Buffer.from(payload, 'utf8');

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    crc = ((crc << 8) ^ CRC_TABLE[((crc >>> 8) ^ byte) & 0xff]) & 0xffff;
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const STATIC_INDICATOR = '010211';
const DYNAMIC_INDICATOR = '010212';
const COUNTRY_TAG = '5802ID';

/**
 * Converts a static QRIS string into a dynamic QRIS string with a fixed transaction amount.
 *
 * @param staticQris - The raw static QRIS string from GoBiz merchant portal
 * @param amount - The exact amount to pay (in IDR integer)
 * @returns The new dynamic QRIS string with Tag 54 (amount) and updated CRC16 checksum
 */
export function buildDynamicQris(staticQris: string, amount: number): string {
  if (!staticQris || typeof staticQris !== 'string') {
    throw new Error('Static QRIS string is required');
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${amount}. Must be a positive integer.`);
  }

  let raw = staticQris.trim();

  // Strip trailing CRC16 tag if present (e.g. 6304XXXX)
  const crcIndex = raw.lastIndexOf('6304');
  if (crcIndex !== -1 && crcIndex === raw.length - 8) {
    raw = raw.substring(0, crcIndex);
  }

  // Switch point-of-initiation method from static (010211) to dynamic (010212)
  if (raw.includes(STATIC_INDICATOR)) {
    raw = raw.replace(STATIC_INDICATOR, DYNAMIC_INDICATOR);
  }

  // Format Tag 54 (Transaction Amount): Tag (54) + Length (2 digits) + Value
  const amountStr = amount.toString();
  const amountTagLen = amountStr.length.toString().padStart(2, '0');
  const amountTag = `54${amountTagLen}${amountStr}`;

  // If Tag 54 already exists, replace it; otherwise inject it right before Country Code Tag (5802ID)
  let basePayload: string;
  const tag54Regex = /54\d{2}\d+/;

  if (tag54Regex.test(raw)) {
    basePayload = raw.replace(tag54Regex, amountTag);
  } else {
    const countryIdx = raw.indexOf(COUNTRY_TAG);
    if (countryIdx !== -1) {
      basePayload = raw.slice(0, countryIdx) + amountTag + raw.slice(countryIdx);
    } else {
      basePayload = raw + amountTag;
    }
  }

  // Append Tag 6304 (CRC placeholder) and compute CRC16-CCITT checksum
  const payloadWithTag63 = `${basePayload}6304`;
  const checksum = crc16Ccitt(payloadWithTag63);

  return `${payloadWithTag63}${checksum}`;
}
