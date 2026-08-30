import { getGoBizClient, isMockMode } from '../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const mock = isMockMode(event);
  const client = getGoBizClient(event);
  const outletId = body.outlet_id || client.config.outletId || 'G000012345';
  const catalog = body.catalog;

  if (!catalog) {
    throw createError({ statusCode: 400, statusMessage: 'Menu catalog payload is required' });
  }

  if (mock) {
    return {
      outlet_id: outletId,
      status: 'CATALOG_SYNCED',
      categories_synced: catalog.categories?.length || 2,
      synced_at: new Date().toISOString(),
      message: 'GoFood menu catalog has been pushed and synced successfully.',
    };
  }

  try {
    const result = await client.food.syncMenu(outletId, catalog);
    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
