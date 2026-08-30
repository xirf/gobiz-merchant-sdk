import { GoPay } from '../src/index.js';
import { Currency, PaymentInstrument, Language, StatementFormat, QrCodeFormat } from '../src/constants/enums.js';

let defaultCredentials = {
  goid: process.env.GOPAY_GOID || '8583067438',
  clientId: process.env.GOPAY_CLIENT_ID || '1223619925',
  clientSecret: process.env.GOPAY_CLIENT_SECRET || '6vkhVP8c',
  isProductionMode: false,
};

function getClient(overrideConfig?: any): GoPay {
  return new GoPay({
    ...defaultCredentials,
    ...overrideConfig,
  });
}

const PORT = Number(process.env.PORT) || 3000;

console.log(`Starting GoPay Merchant SDK Dashboard on http://localhost:${PORT}...`);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-gopay-config',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Static assets
    if (pathname === '/' || pathname === '/index.html') {
      const htmlFile = Bun.file('./dashboard/public/index.html');
      if (await htmlFile.exists()) {
        return new Response(htmlFile, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      return new Response('Dashboard HTML not found', { status: 404 });
    }

    // Helper for extracting optional client override from header
    const getOverride = () => {
      const configHeader = req.headers.get('x-gopay-config');
      if (configHeader) {
        try {
          return JSON.parse(configHeader);
        } catch {
          // ignore
        }
      }
      return undefined;
    };

    try {
      // 1. Get current config / token check
      if (pathname === '/api/config/info' && req.method === 'GET') {
        const client = getClient(getOverride());
        const token = await client.auth.getAccessToken();
        return Response.json({
          goid: client.config.goid,
          clientId: client.config.clientId,
          isProductionMode: client.config.isProductionMode,
          tokenPreview: token.substring(0, 10) + '...' + token.substring(token.length - 6),
          embedJsUrl: client.getEmbedJsUrl(),
          gatewayBaseUrl: client.getGatewayBaseUrl(),
        }, { headers: corsHeaders });
      }

      // 2. Create Payment
      if (pathname === '/api/payments/create' && req.method === 'POST') {
        const body = await req.json();
        const client = getClient(getOverride());
        const result = await client.payments.create(body);
        return Response.json(result, { headers: corsHeaders });
      }

      // 3. Get Payment Status
      if (pathname.startsWith('/api/payments/') && req.method === 'GET' && !pathname.endsWith('/refunds') && !pathname.endsWith('/qr')) {
        const paymentId = pathname.replace('/api/payments/', '');
        const client = getClient(getOverride());
        const result = await client.payments.getStatus(paymentId);
        return Response.json(result, { headers: corsHeaders });
      }

      // 4. Refund Payment
      if (pathname.match(/^\/api\/payments\/([^/]+)\/refund$/) && req.method === 'POST') {
        const paymentId = pathname.split('/')[3];
        const body = await req.json();
        const client = getClient(getOverride());
        const result = await client.payments.refund(paymentId, body);
        return Response.json(result, { headers: corsHeaders });
      }

      // 5. Get Refunds History
      if (pathname.match(/^\/api\/payments\/([^/]+)\/refunds$/) && req.method === 'GET') {
        const paymentId = pathname.split('/')[3];
        const client = getClient(getOverride());
        const result = await client.payments.getRefunds(paymentId);
        return Response.json(result, { headers: corsHeaders });
      }

      // 6. Get QR Payment
      if (pathname.match(/^\/api\/payments\/([^/]+)\/qr$/) && req.method === 'GET') {
        const paymentId = pathname.split('/')[3];
        const format = url.searchParams.get('format') || undefined;
        const client = getClient(getOverride());
        const result = await client.payments.getQrPayment(paymentId, format);
        return Response.json(result, { headers: corsHeaders });
      }

      // 7. Create Subsequent Recurrence
      if (pathname.match(/^\/api\/recurring\/([^/]+)\/create$/) && req.method === 'POST') {
        const paymentId = pathname.split('/')[3];
        const body = await req.json();
        const client = getClient(getOverride());
        const result = await client.recurring.createRecurrence(paymentId, body);
        return Response.json(result, { headers: corsHeaders });
      }

      // 8. Void Recurrence
      if (pathname.match(/^\/api\/recurring\/([^/]+)\/void$/) && req.method === 'POST') {
        const paymentId = pathname.split('/')[3];
        const client = getClient(getOverride());
        const result = await client.recurring.voidRecurrence(paymentId);
        return Response.json(result, { headers: corsHeaders });
      }

      // 9. Preauthorization Capture (Full or Partial)
      if (pathname.match(/^\/api\/preauth\/([^/]+)\/capture$/) && req.method === 'POST') {
        const paymentId = pathname.split('/')[3];
        const body = await req.json().catch(() => ({}));
        const client = getClient(getOverride());
        const result = body.amount
          ? await client.preauthorization.partialCapture(paymentId, body)
          : await client.preauthorization.capture(paymentId);
        return Response.json(result, { headers: corsHeaders });
      }

      // 10. Preauthorization Void
      if (pathname.match(/^\/api\/preauth\/([^/]+)\/void$/) && req.method === 'POST') {
        const paymentId = pathname.split('/')[3];
        const client = getClient(getOverride());
        const result = await client.preauthorization.voidAuthorization(paymentId);
        return Response.json(result, { headers: corsHeaders });
      }

      // 11. Saved Cards
      if (pathname.startsWith('/api/cards/') && req.method === 'GET') {
        const cardId = pathname.replace('/api/cards/', '');
        const client = getClient(getOverride());
        const result = await client.cards.getCard(cardId);
        return Response.json(result, { headers: corsHeaders });
      }

      if (pathname.startsWith('/api/cards/') && req.method === 'DELETE') {
        const cardId = pathname.replace('/api/cards/', '');
        const client = getClient(getOverride());
        const result = await client.cards.deleteCard(cardId);
        return Response.json(result, { headers: corsHeaders });
      }

      // 12. Payment Methods
      if (pathname.startsWith('/api/methods/') && req.method === 'GET') {
        const currency = pathname.replace('/api/methods/', '') as any;
        const client = getClient(getOverride());
        const result = await client.methods.getPaymentInstruments(currency);
        return Response.json(result, { headers: corsHeaders });
      }

      if (pathname === '/api/methods' && req.method === 'GET') {
        const client = getClient(getOverride());
        const result = await client.methods.getAllPaymentInstruments();
        return Response.json(result, { headers: corsHeaders });
      }

      // 13. Account Statements
      if (pathname === '/api/statements' && req.method === 'POST') {
        const body = await req.json();
        const client = getClient(getOverride());
        const result = await client.accounts.getAccountStatement(body);
        return new Response(result, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err: any) {
      console.error('API Handler error:', err);
      return Response.json({
        error: true,
        status: err.status || 500,
        message: err.message,
        errors: err.errors || [],
        rawBody: err.rawBody || null,
      }, {
        status: err.status || 500,
        headers: corsHeaders,
      });
    }
  },
});
