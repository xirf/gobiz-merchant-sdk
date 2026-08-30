import { GoPay } from '@gopay/merchant-sdk';
import type { H3Event } from 'h3';

export function getGoPayClient(event: H3Event): GoPay {
  const reqHeaders = getHeaders(event);

  const goid = (reqHeaders['x-gopay-goid'] as string) || process.env.GOPAY_GOID || '8583067438';
  const clientId = (reqHeaders['x-gopay-client-id'] as string) || process.env.GOPAY_CLIENT_ID || '1223619925';
  const clientSecret = (reqHeaders['x-gopay-client-secret'] as string) || process.env.GOPAY_CLIENT_SECRET || '6vkhVP8c';
  const isProduction = reqHeaders['x-gopay-is-production'] === 'true';

  return new GoPay({
    goid,
    clientId,
    clientSecret,
    isProductionMode: isProduction,
  });
}
