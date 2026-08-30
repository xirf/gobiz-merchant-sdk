export const GOPAY_URLS = {
  SANDBOX: {
    API: 'https://gw.sandbox.gopay.com/api',
    GATEWAY: 'https://gw.sandbox.gopay.com/gw/v3',
    EMBED_JS: 'https://gw.sandbox.gopay.com/gp-gw/js/embed.js',
  },
  PRODUCTION: {
    API: 'https://gate.gopay.cz/api',
    GATEWAY: 'https://gate.gopay.cz/gw/v3',
    EMBED_JS: 'https://gate.gopay.cz/gp-gw/js/embed.js',
  },
} as const;
