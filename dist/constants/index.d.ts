/**
 * GoBiz API URLs and environment configurations
 */
declare const GOBIZ_URLS: {
    readonly SANDBOX: {
        readonly API_BASE: "https://api.partner-sandbox.gobiz.co.id";
        readonly OAUTH_BASE: "https://integration-goauth.gojekapi.com";
    };
    readonly PRODUCTION: {
        readonly API_BASE: "https://api.gobiz.co.id";
        readonly OAUTH_BASE: "https://accounts.go-jek.com";
    };
};
/**
 * Standard GoAuth Scopes for GoBiz Open API
 */
declare const GoBizScope: {
    readonly PAYMENT_TRANSACTION_WRITE: "payment:transaction:write";
    readonly PAYMENT_TRANSACTION_READ: "payment:transaction:read";
    readonly PAYMENT_POP_READ: "payment:pop:read";
    readonly PARTNER_OUTLET_READ: "partner:outlet:read";
    readonly PARTNER_OUTLET_WRITE: "partner:outlet:write";
    readonly GOFOOD_CATALOG_READ: "gofood:catalog:read";
    readonly GOFOOD_CATALOG_WRITE: "gofood:catalog:write";
    readonly GOFOOD_ORDER_READ: "gofood:order:read";
    readonly GOFOOD_ORDER_WRITE: "gofood:order:write";
    readonly GOFOOD_OUTLET_WRITE: "gofood:outlet:write";
    readonly PROMO_FOOD_PROMO_READ: "promo:food_promo:read";
    readonly PROMO_FOOD_PROMO_WRITE: "promo:food_promo:write";
    readonly MOKAPOS_LIBRARY_READ: "mokapos:library:read";
    readonly MOKAPOS_TRANSACTION_READ: "mokapos:transaction:read";
    readonly MOKAPOS_REPORTING_READ: "mokapos:reporting:read";
    readonly MOKAPOS_CUSTOMER_READ: "mokapos:customer:read";
    readonly MOKAPOS_CHECKOUT_WRITE: "mokapos:checkout:write";
    readonly MOKAPOS_SALESTYPE_READ: "mokapos:salestype:read";
};
type GoBizScopeType = (typeof GoBizScope)[keyof typeof GoBizScope];
/**
 * GoBiz Payment Transaction Status
 */
declare const PaymentTransactionStatus: {
    readonly PENDING: "pending";
    readonly SETTLEMENT: "settlement";
    readonly EXPIRE: "expire";
    readonly CANCEL: "cancel";
    readonly REFUND: "refund";
    readonly FAILURE: "failure";
};
type PaymentTransactionStatusType = (typeof PaymentTransactionStatus)[keyof typeof PaymentTransactionStatus];
/**
 * GoBiz Payment Types
 */
declare const PaymentType: {
    readonly QRIS: "qris";
};
type PaymentTypeType = (typeof PaymentType)[keyof typeof PaymentType];
/**
 * GoFood Order Status
 */
declare const GoFoodOrderStatus: {
    readonly NEW: "NEW";
    readonly ACCEPTED: "ACCEPTED";
    readonly PREPARED: "PREPARED";
    readonly DRIVER_ARRIVED: "DRIVER_ARRIVED";
    readonly COLLECTED: "COLLECTED";
    readonly DELIVERED: "DELIVERED";
    readonly CANCELLED: "CANCELLED";
};
type GoFoodOrderStatusType = (typeof GoFoodOrderStatus)[keyof typeof GoFoodOrderStatus];

export { GOBIZ_URLS, GoBizScope, type GoBizScopeType, GoFoodOrderStatus, type GoFoodOrderStatusType, PaymentTransactionStatus, type PaymentTransactionStatusType, PaymentType, type PaymentTypeType };
