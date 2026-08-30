/**
 * GoBiz API URLs and environment configurations
 */
export const GOBIZ_URLS = {
  SANDBOX: {
    API_BASE: 'https://api.partner-sandbox.gobiz.co.id',
    OAUTH_BASE: 'https://integration-goauth.gojekapi.com',
  },
  PRODUCTION: {
    API_BASE: 'https://api.gobiz.co.id',
    OAUTH_BASE: 'https://accounts.go-jek.com',
  },
} as const;

/**
 * Standard GoAuth Scopes for GoBiz Open API
 */
export const GoBizScope = {
  // Payment scopes
  PAYMENT_TRANSACTION_WRITE: 'payment:transaction:write',
  PAYMENT_TRANSACTION_READ: 'payment:transaction:read',
  PAYMENT_POP_READ: 'payment:pop:read',

  // Outlet scopes
  PARTNER_OUTLET_READ: 'partner:outlet:read',
  PARTNER_OUTLET_WRITE: 'partner:outlet:write',

  // GoFood scopes
  GOFOOD_CATALOG_READ: 'gofood:catalog:read',
  GOFOOD_CATALOG_WRITE: 'gofood:catalog:write',
  GOFOOD_ORDER_READ: 'gofood:order:read',
  GOFOOD_ORDER_WRITE: 'gofood:order:write',
  GOFOOD_OUTLET_WRITE: 'gofood:outlet:write',

  // Promo scopes
  PROMO_FOOD_PROMO_READ: 'promo:food_promo:read',
  PROMO_FOOD_PROMO_WRITE: 'promo:food_promo:write',

  // Moka POS scopes
  MOKAPOS_LIBRARY_READ: 'mokapos:library:read',
  MOKAPOS_TRANSACTION_READ: 'mokapos:transaction:read',
  MOKAPOS_REPORTING_READ: 'mokapos:reporting:read',
  MOKAPOS_CUSTOMER_READ: 'mokapos:customer:read',
  MOKAPOS_CHECKOUT_WRITE: 'mokapos:checkout:write',
  MOKAPOS_SALESTYPE_READ: 'mokapos:salestype:read',
} as const;

export type GoBizScopeType = (typeof GoBizScope)[keyof typeof GoBizScope];

/**
 * GoBiz Payment Transaction Status
 */
export const PaymentTransactionStatus = {
  PENDING: 'pending',
  SETTLEMENT: 'settlement',
  EXPIRE: 'expire',
  CANCEL: 'cancel',
  REFUND: 'refund',
  FAILURE: 'failure',
} as const;

export type PaymentTransactionStatusType = (typeof PaymentTransactionStatus)[keyof typeof PaymentTransactionStatus];

/**
 * GoBiz Payment Types
 */
export const PaymentType = {
  QRIS: 'qris',
} as const;

export type PaymentTypeType = (typeof PaymentType)[keyof typeof PaymentType];

/**
 * GoFood Order Status
 */
export const GoFoodOrderStatus = {
  NEW: 'NEW',
  ACCEPTED: 'ACCEPTED',
  PREPARED: 'PREPARED',
  DRIVER_ARRIVED: 'DRIVER_ARRIVED',
  COLLECTED: 'COLLECTED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type GoFoodOrderStatusType = (typeof GoFoodOrderStatus)[keyof typeof GoFoodOrderStatus];
