import { getGoBizClient, isMockMode } from '../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Outlet ID is required' });
  }

  const mock = isMockMode(event);
  const client = getGoBizClient(event);

  if (mock) {
    return {
      id,
      name: id === 'G000012345' ? 'Warung Enak Nusantara' : 'GoBiz Partner Outlet',
      brand_name: 'GoBiz Merchant',
      status: 'ACTIVE',
      pop_id: 'pop-fa6082ea-06da-4483-9c7e-eeb0447ed53e',
      address: {
        address: 'Jl. Jenderal Sudirman No. 28',
        city: 'Jakarta Pusat',
        postal_code: '10220',
      },
      phone_number: '+6281234567890',
      email: 'partner@example.com',
    };
  }

  try {
    const result = await client.outlets.getOutlet(id);
    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
