import { GoBizPortal } from '@gobiz/merchant-sdk';
import { isMockMode } from '../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const mock = isMockMode(event);

  if (mock) {
    return {
      success: true,
      authMethod: body.authMethod || 'password',
      tokenPreview: 'eyJhbGciOi...PORTAL_MOCK_TOKEN',
      merchant: {
        id: 'M12345678',
        name: 'Warung Enak Demo (Portal)',
        email: body.email || 'partner@example.com',
      },
    };
  }

  try {
    const portal = new GoBizPortal({
      authMethod: body.authMethod,
      email: body.email,
      password: body.password,
      token: body.token,
    });

    const token = await portal.getAccessToken();
    let merchantInfo = null;
    try {
      merchantInfo = await portal.getMerchantProfile();
    } catch {
      // Continue if profile endpoint is restricted
    }

    return {
      success: true,
      authMethod: body.authMethod,
      tokenPreview: `${token.substring(0, 10)}...${token.substring(token.length - 6)}`,
      merchant: merchantInfo,
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
