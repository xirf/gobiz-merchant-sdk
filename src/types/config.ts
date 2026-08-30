import type { OAuthScopeType } from '../constants/enums.js';

export interface GoPayConfig {
  /**
   * GoPay Merchant Account ID (GoID)
   */
  goid: number | string;

  /**
   * OAuth 2.0 Client ID
   */
  clientId: string;

  /**
   * OAuth 2.0 Client Secret
   */
  clientSecret: string;

  /**
   * Set to `true` for Production (`https://gate.gopay.cz/api`),
   * `false` for Sandbox (`https://gw.sandbox.gopay.com/api`).
   * Default: `false`
   */
  isProductionMode?: boolean;

  /**
   * Optional custom Base API URL to override standard environments.
   */
  baseUrl?: string;

  /**
   * Default OAuth scope to request ('payment-all' or 'payment-create').
   * Default: 'payment-all'
   */
  defaultScope?: OAuthScopeType;

  /**
   * Pre-emptive token renewal buffer in seconds before expiration.
   * Default: 60 seconds.
   */
  tokenRenewalBufferSeconds?: number;

  /**
   * Request timeout in milliseconds.
   * Default: 30000 (30 seconds).
   */
  timeoutMs?: number;

  /**
   * Optional custom fetch implementation (useful for tests or custom proxies).
   */
  fetch?: typeof globalThis.fetch;
}
