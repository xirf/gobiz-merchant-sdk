export interface GoBizConfig {
  /** GoBiz / Gojek Client ID issued by GoTo Financial */
  clientId: string;
  /** GoBiz / Gojek Client Secret issued by GoTo Financial */
  clientSecret: string;
  /** Default Outlet ID (optional) */
  outletId?: string;
  /** Set true to use production URLs, false for sandbox (default: false) */
  isProductionMode?: boolean;
  /** Request timeout in milliseconds (default: 30000ms) */
  timeout?: number;
  /** Custom base API URL override */
  customApiBaseUrl?: string;
  /** Custom OAuth base URL override */
  customOAuthBaseUrl?: string;
  /** Custom fetch implementation (defaults to global fetch) */
  fetch?: typeof fetch;
}

export interface GoBizApiErrorItem {
  code?: string;
  field?: string;
  message_title?: string;
  message: string;
  message_severity?: 'error' | 'warning' | 'info';
  [key: string]: any;
}

export interface GoBizApiResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: GoBizApiErrorItem[];
}
