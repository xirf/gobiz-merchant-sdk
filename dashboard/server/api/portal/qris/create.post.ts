import { GoBizPortal } from '@xirf/gobiz-merchant-sdk';

const DEFAULT_SAMPLE_QRIS =
  '00020101021126610014COM.GO-JEK.WWW01189360091430438058080210G7641517890303UMI51440014ID.CO.QRIS.WWW0215ID10190450190010303UMI5204581253033605802ID5907GoBiz6015Jakarta61051022062070703A0163045E1B';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const staticQris = body.staticQris || process.env.QRIS_STRING || DEFAULT_SAMPLE_QRIS;
  const digits = body.uniqueCodeDigits ? (Number(body.uniqueCodeDigits) as 2 | 3) : 3;

  try {
    const portal = new GoBizPortal({
      staticQris,
      uniqueCodeDigits: digits,
      uniqueCodeMin: body.uniqueCodeMin,
      uniqueCodeMax: body.uniqueCodeMax,
    });

    const payment = portal.createDynamicPayment({
      amount: Number(body.amount) || 10000,
      fee: Number(body.fee) || 0,
      uniqueCode: body.uniqueCode ? Number(body.uniqueCode) : undefined,
      uniqueCodeDigits: digits,
      trxId: body.trxId,
      metadata: body.metadata,
      callbackUrl: body.callbackUrl,
    });

    return payment;
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message,
    });
  }
});
