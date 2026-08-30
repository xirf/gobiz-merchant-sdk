import { getGoBizClient, isMockMode } from '../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const mock = isMockMode(event);
  const client = getGoBizClient(event);
  const outletId = body.outlet_id || client.config.outletId || 'G000012345';
  const orderId = body.order_id;

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID is required' });
  }

  if (mock) {
    return {
      order_id: orderId,
      outlet_id: outletId,
      status: 'PREPARED',
      notified_at: new Date().toISOString(),
      message: 'GoFood driver has been notified that order is ready for pickup.',
    };
  }

  try {
    const result = await client.food.markFoodReady(outletId, orderId);
    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
