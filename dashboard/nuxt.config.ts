import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const currentDir = fileURLToPath(new URL('.', import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
  ],
  alias: {
    '@gobiz/merchant-sdk': resolve(currentDir, '../src/index.ts'),
    '@gopay/merchant-sdk': resolve(currentDir, '../src/index.ts'),
  },
  css: [
    '~/assets/css/tailwind.css',
  ],
  app: {
    head: {
      title: 'GoBiz Open API Dashboard | GoTo Financial',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Interactive playground and testing dashboard for GoBiz Open API (GoTo / Gojek).' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛵</text></svg>' },
      ],
    },
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.js',
  },
});
