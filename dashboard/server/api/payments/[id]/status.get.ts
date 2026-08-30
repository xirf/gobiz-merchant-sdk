import { getGoBizClient, isMockMode } from '../../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const query = getQuery(event);
  const mock = isMockMode(event);
  const client = getGoBizClient(event);
  const outletId = (query.outlet_id as string) || client.config.outletId || 'G000012345';

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Transaction ID is required' });
  }

  if (mock) {
    return {
      outlet: {
        id: outletId,
      },
      transaction: {
        id,
        payment_type: 'qris',
        status: 'settlement',
        qris_string: `00020101021226610014COM.GO-JEK.WWW...`,
        order_id: 'ORDER-DEMO-001',
        gross_amount: 50000,
        currency: 'IDR',
        created_at: new Date(Date.now() - 120000).toISOString(),
        settlement_at: new Date().toISOString(),
      },
      actions: [],
    };
  }

  try {
    const result = await client.payments.getTransaction(outletId, id);
    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
