import { getSharedGoBizPortal, isMockMode, getMockMutations } from '../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const mock = isMockMode(event);

  if (mock) {
    return getMockMutations();
  }

  const portal = getSharedGoBizPortal(event);
  const force = query.force === 'true';

  try {
    const list = await portal.getTransactions({ force });
    return list;
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
