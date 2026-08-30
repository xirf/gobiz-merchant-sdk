import { getGoBizClient, isMockMode } from '../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const mock = isMockMode(event);
  const client = getGoBizClient(event);

  if (mock) {
    return {
      outlets: [
        {
          id: client.config.outletId || 'G000012345',
          name: 'Warung Enak Nusantara (Demo Outlet)',
          brand_name: 'Warung Enak',
          address: {
            address: 'Jl. Jenderal Sudirman No. 28',
            city: 'Jakarta Pusat',
            postal_code: '10220',
            latitude: -6.2088,
            longitude: 106.8456,
          },
          phone_number: '+6281234567890',
          email: 'partner@warungenak.co.id',
          status: 'ACTIVE',
          pop_id: 'pop-fa6082ea-06da-4483-9c7e-eeb0447ed53e',
        },
        {
          id: 'G000099881',
          name: 'Kopi Kenangan Senopati (Demo Outlet)',
          brand_name: 'Kopi Kenangan',
          address: {
            address: 'Jl. Senopati No. 12',
            city: 'Jakarta Selatan',
            postal_code: '12190',
          },
          phone_number: '+628119876543',
          status: 'ACTIVE',
        },
      ],
      page_info: {
        page: 1,
        page_size: 10,
        total_count: 2,
      },
    };
  }

  try {
    const query = getQuery(event);
    const page = query.page ? Number(query.page) : undefined;
    const pageSize = query.page_size ? Number(query.page_size) : undefined;

    const result = await client.outlets.getAllLinkedOutlets(page, pageSize);
    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
