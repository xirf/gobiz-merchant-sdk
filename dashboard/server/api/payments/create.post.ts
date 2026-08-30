import { getGoBizClient, isMockMode } from '../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const mock = isMockMode(event);
  const client = getGoBizClient(event);
  const outletId = body.outlet_id || client.config.outletId || 'G000012345';
  const idempotencyKey = body.idempotency_key || undefined;

  if (mock) {
    const txId = 'tx_' + Math.random().toString(36).substring(2, 12);
    const amount = body.transaction_details?.gross_amount || 50000;
    const orderId = body.transaction_details?.order_id || 'ORDER-DEMO-001';

    // Real standard QRIS payload format
    const qrisString = `00020101021226610014COM.GO-JEK.WWW01189360091430438058080210G7641517890303UMI51440014ID.CO.QRIS.WWW0215ID10190450190010303UMI5204581253033605802ID5907GoBiz6015Jakarta61051022062470703A015036${txId}5406${amount}.0063044447`;

    return {
      outlet: {
        id: outletId,
        pop_id: 'pop-fa6082ea-06da-4483-9c7e-eeb0447ed53e',
      },
      transaction: {
        id: txId,
        payment_type: 'qris',
        status: 'pending',
        qris_string: qrisString,
        order_id: orderId,
        gross_amount: amount,
        currency: 'IDR',
        created_at: new Date().toISOString(),
        settlement_at: null,
      },
      actions: [
        {
          name: 'generate-qr-code',
          method: 'GET',
          url: `https://api.partner-sandbox.gobiz.co.id/transactions/${txId}/qr-code`,
        },
      ],
    };
  }

  try {
    const result = await client.payments.createTransaction(
      outletId,
      {
        payment_type: 'qris',
        transaction_details: body.transaction_details,
        item_details: body.item_details,
        customer_details: body.customer_details,
        metadata: body.metadata,
      },
      idempotencyKey,
    );

    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
