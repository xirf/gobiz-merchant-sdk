import { getSharedGoBizPortal, isMockMode, recordMockMutation } from '../../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const mock = isMockMode(event);
  const amountToPay = Number(body.amountToPay);

  if (!amountToPay) {
    throw createError({ statusCode: 400, statusMessage: 'amountToPay is required' });
  }

  if (mock) {
    const tx = recordMockMutation(amountToPay, body.orderId || body.trxId);
    return {
      paid: true,
      amountToPay,
      paidAt: tx.settlement_time,
      transaction: tx,
      fromCache: false,
      nextCheckInSeconds: 45,
    };
  }

  const portal = getSharedGoBizPortal(event);

  if (body.token) {
    portal.setCookieToken(body.token);
  }
  if (body.email && body.password) {
    portal.config.email = body.email;
    portal.config.password = body.password;
  }

  try {
    const result = await portal.checkSettlement(amountToPay, {
      force: body.force === true,
    });
    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
