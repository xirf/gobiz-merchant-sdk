import { getGoBizClient, isMockMode } from '../../utils/gobiz.js';

export default defineEventHandler(async (event) => {
  const mock = isMockMode(event);
  const client = getGoBizClient(event);

  if (mock) {
    return {
      success: true,
      clientId: client.config.clientId,
      outletId: client.config.outletId,
      isProductionMode: client.config.isProductionMode,
      isMockMode: true,
      tokenPreview: 'eyJhbGciOi...SIMULATED_TOKEN',
      authError: null,
      apiBaseUrl: client.getApiBaseUrl(),
      oauthBaseUrl: client.getOAuthBaseUrl(),
    };
  }

  try {
    let tokenPreview = 'Connected';
    let authError = null;

    try {
      const token = await client.auth.getAccessToken('partner:outlet:read');
      tokenPreview = `${token.substring(0, 10)}...${token.substring(token.length - 6)}`;
    } catch (err: any) {
      authError = err.message;
    }

    return {
      success: true,
      clientId: client.config.clientId,
      outletId: client.config.outletId,
      isProductionMode: client.config.isProductionMode,
      isMockMode: false,
      tokenPreview,
      authError,
      apiBaseUrl: client.getApiBaseUrl(),
      oauthBaseUrl: client.getOAuthBaseUrl(),
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message,
      data: err.errors || null,
    });
  }
});
