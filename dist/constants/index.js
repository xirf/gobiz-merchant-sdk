'use strict';

// src/constants/index.ts
var GOBIZ_URLS = {
  SANDBOX: {
    API_BASE: "https://api.partner-sandbox.gobiz.co.id",
    OAUTH_BASE: "https://integration-goauth.gojekapi.com"
  },
  PRODUCTION: {
    API_BASE: "https://api.gobiz.co.id",
    OAUTH_BASE: "https://accounts.go-jek.com"
  }
};
var GoBizScope = {
  // Payment scopes
  PAYMENT_TRANSACTION_WRITE: "payment:transaction:write",
  PAYMENT_TRANSACTION_READ: "payment:transaction:read",
  PAYMENT_POP_READ: "payment:pop:read",
  // Outlet scopes
  PARTNER_OUTLET_READ: "partner:outlet:read",
  PARTNER_OUTLET_WRITE: "partner:outlet:write",
  // GoFood scopes
  GOFOOD_CATALOG_READ: "gofood:catalog:read",
  GOFOOD_CATALOG_WRITE: "gofood:catalog:write",
  GOFOOD_ORDER_READ: "gofood:order:read",
  GOFOOD_ORDER_WRITE: "gofood:order:write",
  GOFOOD_OUTLET_WRITE: "gofood:outlet:write",
  // Promo scopes
  PROMO_FOOD_PROMO_READ: "promo:food_promo:read",
  PROMO_FOOD_PROMO_WRITE: "promo:food_promo:write",
  // Moka POS scopes
  MOKAPOS_LIBRARY_READ: "mokapos:library:read",
  MOKAPOS_TRANSACTION_READ: "mokapos:transaction:read",
  MOKAPOS_REPORTING_READ: "mokapos:reporting:read",
  MOKAPOS_CUSTOMER_READ: "mokapos:customer:read",
  MOKAPOS_CHECKOUT_WRITE: "mokapos:checkout:write",
  MOKAPOS_SALESTYPE_READ: "mokapos:salestype:read"
};
var PaymentTransactionStatus = {
  PENDING: "pending",
  SETTLEMENT: "settlement",
  EXPIRE: "expire",
  CANCEL: "cancel",
  REFUND: "refund",
  FAILURE: "failure"
};
var PaymentType = {
  QRIS: "qris"
};
var GoFoodOrderStatus = {
  NEW: "NEW",
  ACCEPTED: "ACCEPTED",
  PREPARED: "PREPARED",
  DRIVER_ARRIVED: "DRIVER_ARRIVED",
  COLLECTED: "COLLECTED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED"
};

exports.GOBIZ_URLS = GOBIZ_URLS;
exports.GoBizScope = GoBizScope;
exports.GoFoodOrderStatus = GoFoodOrderStatus;
exports.PaymentTransactionStatus = PaymentTransactionStatus;
exports.PaymentType = PaymentType;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map