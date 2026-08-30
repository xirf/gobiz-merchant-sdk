'use strict';

var crypto2 = require('crypto');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var crypto2__default = /*#__PURE__*/_interopDefault(crypto2);

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

// src/errors/gobiz-error.ts
var GoBizError = class _GoBizError extends Error {
  status;
  errors;
  rawBody;
  constructor(message, status = 500, errors = [], rawBody) {
    super(message);
    this.name = "GoBizError";
    this.status = status;
    this.errors = errors;
    this.rawBody = rawBody;
    Object.setPrototypeOf(this, _GoBizError.prototype);
  }
  static fromResponse(status, body) {
    let message = `GoBiz API request failed with HTTP ${status}`;
    let errors = [];
    if (body && typeof body === "object") {
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        errors = body.errors;
        const descriptions = errors.map((e) => e.message_title ? `[${e.message_title}] ${e.message}` : e.message).join("; ");
        message = `GoBiz Error (${status}): ${descriptions}`;
      } else if (body.error_description || body.error) {
        message = `GoBiz Error (${status}): ${body.error_description || body.error}`;
      } else if (body.message) {
        message = `GoBiz Error (${status}): ${body.message}`;
      }
    } else if (typeof body === "string" && body.length > 0) {
      message = `GoBiz Error (${status}): ${body.substring(0, 200)}`;
    }
    return new _GoBizError(message, status, errors, body);
  }
};

// src/services/auth.service.ts
var GoAuthService = class {
  config;
  tokenCache = /* @__PURE__ */ new Map();
  pendingRequests = /* @__PURE__ */ new Map();
  constructor(config) {
    this.config = config;
  }
  getOAuthBaseUrl() {
    if (this.config.customOAuthBaseUrl) {
      return this.config.customOAuthBaseUrl.replace(/\/+$/, "");
    }
    return this.config.isProductionMode ? GOBIZ_URLS.PRODUCTION.OAUTH_BASE : GOBIZ_URLS.SANDBOX.OAUTH_BASE;
  }
  getApiBaseUrl() {
    if (this.config.customApiBaseUrl) {
      return this.config.customApiBaseUrl.replace(/\/+$/, "");
    }
    return this.config.isProductionMode ? GOBIZ_URLS.PRODUCTION.API_BASE : GOBIZ_URLS.SANDBOX.API_BASE;
  }
  /**
   * Get an active access token for specified scope(s).
   * Caches tokens in memory, pre-emptively refreshes near expiry, and deduplicates concurrent calls.
   */
  async getAccessToken(scope = GoBizScope.PAYMENT_TRANSACTION_WRITE) {
    const cached = this.tokenCache.get(scope);
    const now = Date.now();
    if (cached && cached.expiresAt - now > 6e4) {
      return cached.accessToken;
    }
    if (this.pendingRequests.has(scope)) {
      return this.pendingRequests.get(scope);
    }
    const requestPromise = this.fetchNewToken(scope).then((token) => {
      this.pendingRequests.delete(scope);
      return token;
    }).catch((err) => {
      this.pendingRequests.delete(scope);
      throw err;
    });
    this.pendingRequests.set(scope, requestPromise);
    return requestPromise;
  }
  async fetchNewToken(scope) {
    const oauthUrl = `${this.getOAuthBaseUrl()}/oauth2/token`;
    const fetchFn = this.config.fetch || globalThis.fetch;
    const basicAuth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("scope", scope);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 3e4);
    try {
      const response = await fetchFn(oauthUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: params.toString(),
        signal: controller.signal
      });
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      if (!response.ok) {
        throw GoBizError.fromResponse(response.status, responseData);
      }
      const tokenData = responseData;
      const expiresInMs = (tokenData.expires_in || 3600) * 1e3;
      this.tokenCache.set(scope, {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || "Bearer",
        expiresAt: Date.now() + expiresInMs,
        scope: tokenData.scope || scope
      });
      return tokenData.access_token;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new GoBizError("OAuth token request timed out", 408);
      }
      if (err instanceof GoBizError) {
        throw err;
      }
      throw new GoBizError(err.message || "Failed to authenticate with GoAuth", 500, [], err);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Clear all cached access tokens
   */
  clearCache() {
    this.tokenCache.clear();
    this.pendingRequests.clear();
  }
};

// src/services/base.service.ts
var BaseService = class {
  config;
  auth;
  constructor(config, auth) {
    this.config = config;
    this.auth = auth;
  }
  async request(options) {
    const token = await this.auth.getAccessToken(options.scope);
    const baseUrl = this.auth.getApiBaseUrl();
    let url = `${baseUrl}${options.path.startsWith("/") ? options.path : "/" + options.path}`;
    if (options.queryParams) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.queryParams)) {
        if (value !== void 0) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...options.customHeaders
    };
    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }
    let bodyPayload;
    if (options.body !== void 0) {
      headers["Content-Type"] = "application/json";
      bodyPayload = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }
    const fetchFn = this.config.fetch || globalThis.fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 3e4);
    try {
      const response = await fetchFn(url, {
        method: options.method,
        headers,
        body: bodyPayload,
        signal: controller.signal
      });
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      if (!response.ok) {
        throw GoBizError.fromResponse(response.status, responseData);
      }
      if (responseData && typeof responseData === "object" && "success" in responseData) {
        const apiResponse = responseData;
        if (apiResponse.success === false) {
          throw GoBizError.fromResponse(response.status, responseData);
        }
        return apiResponse.data !== void 0 ? apiResponse.data : responseData;
      }
      return responseData;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new GoBizError(`Request to ${options.path} timed out`, 408);
      }
      if (err instanceof GoBizError) {
        throw err;
      }
      throw new GoBizError(err.message || "GoBiz API request failed", 500, [], err);
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

// src/services/payment.service.ts
var PaymentService = class extends BaseService {
  /**
   * Create a dynamic QRIS payment transaction for an outlet.
   *
   * @param outletId - The Outlet ID where the transaction will be recorded
   * @param payload - Transaction details, items, customer info
   * @param idempotencyKey - Unique idempotency string (max 32 characters)
   */
  async createTransaction(outletId, payload, idempotencyKey) {
    if (!outletId) {
      throw new GoBizError("Outlet ID is required to create a payment transaction", 400);
    }
    return this.request({
      method: "POST",
      path: `/integrations/payment/outlets/${outletId}/v2/transactions`,
      scope: GoBizScope.PAYMENT_TRANSACTION_WRITE,
      body: payload,
      idempotencyKey: idempotencyKey || this.generateIdempotencyKey()
    });
  }
  /**
   * Get details and live status of a payment transaction.
   *
   * @param outletId - The Outlet ID
   * @param transactionId - The ID of the transaction
   */
  async getTransaction(outletId, transactionId) {
    if (!outletId) {
      throw new GoBizError("Outlet ID is required to get a payment transaction", 400);
    }
    if (!transactionId) {
      throw new GoBizError("Transaction ID is required", 400);
    }
    return this.request({
      method: "GET",
      path: `/integrations/payment/outlets/${outletId}/v1/transactions/${transactionId}`,
      scope: GoBizScope.PAYMENT_TRANSACTION_READ
    });
  }
  /**
   * Extract QR Code image URL from transaction response action list
   */
  getQrCodeUrl(response) {
    if (response && Array.isArray(response.actions)) {
      const qrAction = response.actions.find((a) => a.name === "generate-qr-code");
      if (qrAction && qrAction.url) {
        return qrAction.url;
      }
    }
    return null;
  }
  generateIdempotencyKey() {
    return "gb_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
};

// src/services/outlet.service.ts
var OutletService = class extends BaseService {
  /**
   * Get list of all linked merchant outlets
   */
  async getAllLinkedOutlets(page, pageSize) {
    return this.request({
      method: "GET",
      path: "/integrations/partner/v1/linked-outlets",
      scope: GoBizScope.PARTNER_OUTLET_READ,
      queryParams: {
        page,
        page_size: pageSize
      }
    });
  }
  /**
   * Get detailed information about a specific outlet
   */
  async getOutlet(outletId) {
    if (!outletId) {
      throw new GoBizError("Outlet ID is required", 400);
    }
    return this.request({
      method: "GET",
      path: `/integrations/partner/outlets/${outletId}/v1`,
      scope: GoBizScope.PARTNER_OUTLET_READ
    });
  }
  /**
   * Get authenticated outlet information based on the current access token
   */
  async getTokenInfo() {
    return this.request({
      method: "GET",
      path: "/integrations/partner/v1/token-info",
      scope: GoBizScope.PARTNER_OUTLET_READ
    });
  }
  /**
   * Link an outlet to partner integration
   */
  async linkOutlet(payload) {
    return this.request({
      method: "PUT",
      path: "/integrations/partner/v1/outlet-link",
      scope: GoBizScope.PARTNER_OUTLET_WRITE,
      body: payload
    });
  }
  /**
   * Unlink an outlet from partner integration
   */
  async unlinkOutlet(payload) {
    return this.request({
      method: "DELETE",
      path: "/integrations/partner/v1/outlet-link",
      scope: GoBizScope.PARTNER_OUTLET_WRITE,
      body: payload
    });
  }
};

// src/services/food.service.ts
var FoodService = class extends BaseService {
  /**
   * Sync/Push updated GoFood menu catalog for an outlet
   */
  async syncMenu(outletId, catalog) {
    if (!outletId) {
      throw new GoBizError("Outlet ID is required", 400);
    }
    return this.request({
      method: "PUT",
      path: `/integrations/gofood/outlets/${outletId}/v1/catalogs`,
      scope: GoBizScope.GOFOOD_CATALOG_WRITE,
      body: catalog
    });
  }
  /**
   * Mark a GoFood kitchen order as prepared/ready for driver pickup
   */
  async markFoodReady(outletId, orderId) {
    if (!outletId || !orderId) {
      throw new GoBizError("Outlet ID and Order ID are required", 400);
    }
    return this.request({
      method: "POST",
      path: `/integrations/gofood/outlets/${outletId}/v1/orders/${orderId}/ready`,
      scope: GoBizScope.GOFOOD_ORDER_WRITE
    });
  }
  /**
   * Accept an incoming GoFood order
   */
  async acceptOrder(outletId, orderId) {
    if (!outletId || !orderId) {
      throw new GoBizError("Outlet ID and Order ID are required", 400);
    }
    return this.request({
      method: "POST",
      path: `/integrations/gofood/outlets/${outletId}/v1/orders/${orderId}/accept`,
      scope: GoBizScope.GOFOOD_ORDER_WRITE
    });
  }
  /**
   * Get restaurant properties (opening hours, auto-accept status)
   */
  async getOutletProperties(outletId) {
    if (!outletId) {
      throw new GoBizError("Outlet ID is required", 400);
    }
    return this.request({
      method: "GET",
      path: `/integrations/gofood/outlets/${outletId}/v1/properties`,
      scope: GoBizScope.GOFOOD_CATALOG_READ
    });
  }
  /**
   * Get active promotions for an outlet
   */
  async getPromotions(outletId) {
    if (!outletId) {
      throw new GoBizError("Outlet ID is required", 400);
    }
    return this.request({
      method: "GET",
      path: `/integrations/promo/outlets/${outletId}/v1/promos`,
      scope: GoBizScope.PROMO_FOOD_PROMO_READ
    });
  }
};

// src/utils/qris.ts
var CRC_TABLE = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  let curr = i << 8;
  for (let j = 0; j < 8; j++) {
    curr = (curr & 32768) !== 0 ? curr << 1 ^ 4129 : curr << 1;
  }
  CRC_TABLE[i] = curr & 65535;
}
function crc16Ccitt(payload) {
  let crc = 65535;
  const bytes = Buffer.from(payload, "utf8");
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    crc = (crc << 8 ^ CRC_TABLE[(crc >>> 8 ^ byte) & 255]) & 65535;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
var STATIC_INDICATOR = "010211";
var DYNAMIC_INDICATOR = "010212";
var COUNTRY_TAG = "5802ID";
function buildDynamicQris(staticQris, amount) {
  if (!staticQris || typeof staticQris !== "string") {
    throw new Error("Static QRIS string is required");
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${amount}. Must be a positive integer.`);
  }
  let raw = staticQris.trim();
  const crcIndex = raw.lastIndexOf("6304");
  if (crcIndex !== -1 && crcIndex === raw.length - 8) {
    raw = raw.substring(0, crcIndex);
  }
  if (raw.includes(STATIC_INDICATOR)) {
    raw = raw.replace(STATIC_INDICATOR, DYNAMIC_INDICATOR);
  }
  const amountStr = amount.toString();
  const amountTagLen = amountStr.length.toString().padStart(2, "0");
  const amountTag = `54${amountTagLen}${amountStr}`;
  let basePayload;
  const tag54Regex = /54\d{2}\d+/;
  if (tag54Regex.test(raw)) {
    basePayload = raw.replace(tag54Regex, amountTag);
  } else {
    const countryIdx = raw.indexOf(COUNTRY_TAG);
    if (countryIdx !== -1) {
      basePayload = raw.slice(0, countryIdx) + amountTag + raw.slice(countryIdx);
    } else {
      basePayload = raw + amountTag;
    }
  }
  const payloadWithTag63 = `${basePayload}6304`;
  const checksum = crc16Ccitt(payloadWithTag63);
  return `${payloadWithTag63}${checksum}`;
}

// src/services/portal.service.ts
var BASE_URL = "https://api.gobiz.co.id";
var ANALYTICS_URL = "https://api.gojekapi.com/merchant-analytics/v2/merchants/transactions";
var CLIENT_ID = "go-biz-web-new";
var GoBizPortalService = class {
  config;
  token = null;
  merchantId = null;
  uniqueCodeCursor = 1;
  // --- Native Global Poller & Deduplication Engine ---
  pollIntervalMinMs;
  pollIntervalMaxMs;
  lastPolledAt = 0;
  nextAllowedPollAt = 0;
  cachedTransactions = [];
  activePollPromise = null;
  // Background Poller State
  pollerTimerId = null;
  isRunningPoller = false;
  paidListeners = /* @__PURE__ */ new Set();
  activeWatchers = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    const digits = config.uniqueCodeDigits || 3;
    const defaultMin = digits === 2 ? 10 : 100;
    const defaultMax = digits === 2 ? 99 : 999;
    this.pollIntervalMinMs = config.pollIntervalMinMs || 3e4;
    this.pollIntervalMaxMs = config.pollIntervalMaxMs || 24e4;
    this.config = {
      authMethod: config.authMethod || (config.token ? "cookie" : "password"),
      uniqueCodeDigits: digits,
      uniqueCodeMin: config.uniqueCodeMin ?? defaultMin,
      uniqueCodeMax: config.uniqueCodeMax ?? defaultMax,
      roundingMode: config.roundingMode || "up",
      pollIntervalMinMs: this.pollIntervalMinMs,
      pollIntervalMaxMs: this.pollIntervalMaxMs,
      timeout: config.timeout || 3e4,
      ...config
    };
    this.uniqueCodeCursor = this.config.uniqueCodeMin || defaultMin;
    if (config.token) {
      this.token = config.token;
    }
    if (config.merchantId) {
      this.merchantId = config.merchantId;
    }
    this.scheduleNextWindow();
  }
  getRandomIntervalMs() {
    return Math.floor(Math.random() * (this.pollIntervalMaxMs - this.pollIntervalMinMs + 1)) + this.pollIntervalMinMs;
  }
  scheduleNextWindow() {
    const delay = this.getRandomIntervalMs();
    this.nextAllowedPollAt = Date.now() + delay;
  }
  /**
   * Returns portal browser-mimicking headers for GoBiz web APIs
   */
  getPortalHeaders(accessToken) {
    const tokenToUse = accessToken || this.token;
    return {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "id",
      "Authentication-Type": "go-id",
      Authorization: tokenToUse ? `Bearer ${tokenToUse}` : "Bearer",
      "Content-Type": "application/json",
      "Gojek-Country-Code": "ID",
      "Gojek-Timezone": "Asia/Jakarta",
      Origin: "https://portal.gofoodmerchant.co.id",
      Referer: "https://portal.gofoodmerchant.co.id/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "X-AppVersion": "platform-v3.107.0",
      "X-Platform": "Web",
      "X-User-Type": "merchant",
      "x-DeviceOS": "Web",
      "x-appId": "go-biz-web-dashboard",
      "x-uniqueid": crypto2__default.default.randomUUID()
    };
  }
  async postJson(url, headers, payload) {
    const fetchFn = this.config.fetch || globalThis.fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    try {
      const response = await fetchFn(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const text = await response.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      if (!response.ok) {
        throw GoBizError.fromResponse(response.status, body);
      }
      return body;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  async getJson(url, headers) {
    const fetchFn = this.config.fetch || globalThis.fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    try {
      const response = await fetchFn(url, {
        method: "GET",
        headers,
        signal: controller.signal
      });
      const text = await response.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      if (!response.ok) {
        throw GoBizError.fromResponse(response.status, body);
      }
      return body;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Log into GoBiz Merchant Portal using Email and Password
   */
  async loginWithPassword(email, password) {
    const targetEmail = email || this.config.email;
    const targetPassword = password || this.config.password;
    if (!targetEmail || !targetPassword) {
      throw new Error("Email and Password are required for GoBiz portal password login.");
    }
    const headers = this.getPortalHeaders();
    const validation = await this.postJson(`${BASE_URL}/goid/login/request`, headers, {
      email: targetEmail,
      login_type: "password",
      client_id: CLIENT_ID
    });
    if (validation?.errors?.length > 0) {
      const msg = validation.errors[0]?.message || "Email validation failed";
      throw new Error(`GoBiz Email Validation Error: ${msg}`);
    }
    const tokenRes = await this.postJson(`${BASE_URL}/goid/token`, headers, {
      client_id: CLIENT_ID,
      grant_type: "password",
      data: {
        email: targetEmail,
        password: targetPassword
      }
    });
    if (tokenRes?.errors?.length > 0) {
      const msg = tokenRes.errors[0]?.message || "Password authentication failed";
      throw new Error(`GoBiz Login Error: ${msg}`);
    }
    if (!tokenRes.access_token) {
      throw new Error("GoBiz did not return an access_token");
    }
    this.token = tokenRes.access_token;
    return this.token;
  }
  /**
   * Set or update the access token (e.g. from browser cookie)
   */
  setCookieToken(token) {
    this.token = token;
    this.config.token = token;
    this.config.authMethod = "cookie";
  }
  /**
   * Retrieves active access token, automatically logging in if needed
   */
  async getAccessToken() {
    if (this.token) {
      return this.token;
    }
    if (this.config.authMethod === "password" || this.config.email && this.config.password) {
      return this.loginWithPassword();
    }
    throw new Error("No GoBiz portal session available. Provide cookie access_token or email & password.");
  }
  /**
   * Fetches logged-in merchant profile and linked outlets
   */
  async getMerchantProfile() {
    const token = await this.getAccessToken();
    const headers = this.getPortalHeaders(token);
    const res = await this.getJson(`${BASE_URL}/v1/merchants/self`, headers);
    const data = res.data || res;
    if (data.id) {
      this.merchantId = data.id;
    }
    return {
      id: data.id,
      name: data.name || data.merchant_name || "GoBiz Merchant",
      email: data.email,
      phone_number: data.phone_number,
      status: data.status,
      outlets: data.outlets || []
    };
  }
  /**
   * Raw low-level fetch for GoBiz Merchant Analytics transactions
   */
  async fetchRawTransactions(options = {}) {
    const token = await this.getAccessToken();
    const headers = this.getPortalHeaders(token);
    let merchantId = this.merchantId || this.config.merchantId;
    if (!merchantId) {
      try {
        const profile = await this.getMerchantProfile();
        merchantId = profile.id;
      } catch {
      }
    }
    const from = options.from || new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
    const to = options.to || (/* @__PURE__ */ new Date()).toISOString();
    const queryParams = new URLSearchParams({
      from,
      to,
      payment_types: "QRIS,GOPAY,OFFLINE_CREDIT_CARD,OFFLINE_DEBIT_CARD",
      statuses: "SETTLEMENT,CAPTURE"
    });
    if (merchantId) {
      queryParams.append("merchant_id", merchantId);
    }
    const url = `${ANALYTICS_URL}?${queryParams.toString()}`;
    const res = await this.getJson(url, headers);
    const rawList = Array.isArray(res) ? res : res.data || res.transactions || [];
    return rawList.map((item) => ({
      id: item.id || item.transaction_id,
      order_id: item.order_id,
      amount: Number(item.amount || item.gross_amount || 0),
      payment_type: item.payment_type || "QRIS",
      status: item.status || "SETTLEMENT",
      transaction_time: item.transaction_time || item.created_at,
      settlement_time: item.settlement_time || item.settlement_at,
      outlet_id: item.outlet_id
    }));
  }
  /**
   * Fetches latest mutations with global deduplication and throttling across all callers
   */
  async getTransactions(options = {}) {
    const now = Date.now();
    if (this.activePollPromise) {
      return this.activePollPromise;
    }
    if (!options.force && this.cachedTransactions.length > 0 && now < this.nextAllowedPollAt) {
      return this.cachedTransactions;
    }
    this.activePollPromise = (async () => {
      try {
        const list = await this.fetchRawTransactions(options);
        this.cachedTransactions = list;
        this.lastPolledAt = Date.now();
        this.scheduleNextWindow();
        this.notifyWatchers(list);
        return list;
      } finally {
        this.activePollPromise = null;
      }
    })();
    return this.activePollPromise;
  }
  /**
   * Internal helper to notify registered listeners and watchers
   */
  notifyWatchers(transactions) {
    for (const tx of transactions) {
      if (tx.status === "SETTLEMENT" || tx.status === "CAPTURE") {
        for (const listener of this.paidListeners) {
          try {
            listener(tx);
          } catch (err) {
            console.error("Error in GoBizPortal onPaymentPaid listener:", err);
          }
        }
        const watcher = this.activeWatchers.get(tx.amount);
        if (watcher) {
          clearTimeout(watcher.timerId);
          this.activeWatchers.delete(tx.amount);
          try {
            watcher.onPaid(tx);
          } catch (err) {
            console.error("Error in GoBizPortal watchPayment callback:", err);
          }
        }
      }
    }
  }
  /**
   * Generates a dynamic QRIS payment with unique nominal code (2 digits: 10..99 or 3 digits: 100..999)
   */
  createDynamicPayment(params) {
    const staticQris = params.staticQris || this.config.staticQris;
    if (!staticQris) {
      throw new Error(
        "Static QRIS string is required. Please provide it in options or configure staticQris in GoBizPortal."
      );
    }
    const baseAmount = params.amount;
    const fee = params.fee || 0;
    const roundingMode = params.roundingMode || this.config.roundingMode || "up";
    let uniqueCode;
    if (params.uniqueCode !== void 0) {
      uniqueCode = params.uniqueCode;
    } else {
      const digits = params.uniqueCodeDigits || this.config.uniqueCodeDigits || 3;
      const minCode = this.config.uniqueCodeMin ?? (digits === 2 ? 10 : 100);
      const maxCode = this.config.uniqueCodeMax ?? (digits === 2 ? 99 : 999);
      if (this.uniqueCodeCursor < minCode || this.uniqueCodeCursor > maxCode) {
        this.uniqueCodeCursor = minCode;
      }
      uniqueCode = this.uniqueCodeCursor;
      this.uniqueCodeCursor = this.uniqueCodeCursor >= maxCode ? minCode : this.uniqueCodeCursor + 1;
    }
    const amountToPay = roundingMode === "down" ? Math.max(1e3, baseAmount + fee - uniqueCode) : baseAmount + fee + uniqueCode;
    const qrisString = buildDynamicQris(staticQris, amountToPay);
    const trxId = params.trxId || `TRX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e3)}`;
    const expireMinutes = params.expireMinutes || 5;
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1e3).toISOString();
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrisString)}`;
    return {
      trxId,
      amount: baseAmount,
      fee,
      uniqueCode,
      roundingMode,
      amountToPay,
      qrisString,
      qrImageUrl,
      expiresAt,
      metadata: params.metadata,
      callbackUrl: params.callbackUrl || this.config.webhookUrl
    };
  }
  /**
   * Checks if an incoming payment mutation matches the target exact amount
   */
  async checkSettlement(amountToPay, options = {}) {
    const transactions = await this.getTransactions({ force: options.force });
    const match = transactions.find(
      (tx) => (tx.status === "SETTLEMENT" || tx.status === "CAPTURE") && Math.abs(tx.amount - amountToPay) === 0
    );
    const secondsUntilNextPoll = Math.max(0, Math.round((this.nextAllowedPollAt - Date.now()) / 1e3));
    if (match) {
      return {
        paid: true,
        transaction: match,
        amountToPay,
        paidAt: match.settlement_time || match.transaction_time || (/* @__PURE__ */ new Date()).toISOString(),
        fromCache: Date.now() < this.nextAllowedPollAt,
        nextCheckInSeconds: secondsUntilNextPoll
      };
    }
    return {
      paid: false,
      amountToPay,
      fromCache: Date.now() < this.nextAllowedPollAt,
      nextCheckInSeconds: secondsUntilNextPoll
    };
  }
  // --- NATIVE GLOBAL POLLER METHODS ---
  /**
   * Starts the embedded background poller (single instance per portal client).
   * Polls GoBiz periodically with randomized 30s-60s jitter.
   */
  startPoller(onPaid) {
    if (onPaid) {
      this.paidListeners.add(onPaid);
    }
    if (this.isRunningPoller) {
      return;
    }
    this.isRunningPoller = true;
    this.scheduleNextPollerTick();
  }
  scheduleNextPollerTick() {
    if (!this.isRunningPoller) return;
    const delay = this.getRandomIntervalMs();
    this.pollerTimerId = setTimeout(async () => {
      if (!this.isRunningPoller) return;
      try {
        await this.getTransactions({ force: true });
      } catch (err) {
        console.error("GoBizPortal background poller error:", err);
      } finally {
        this.scheduleNextPollerTick();
      }
    }, delay);
  }
  /**
   * Stops the background poller
   */
  stopPoller() {
    this.isRunningPoller = false;
    if (this.pollerTimerId) {
      clearTimeout(this.pollerTimerId);
      this.pollerTimerId = null;
    }
  }
  /**
   * Checks if background poller is running
   */
  isPollerRunning() {
    return this.isRunningPoller;
  }
  /**
   * Returns current poller status
   */
  getPollerStatus() {
    return {
      isRunning: this.isRunningPoller,
      lastPolledAt: this.lastPolledAt ? new Date(this.lastPolledAt).toISOString() : null,
      nextAllowedPollAt: this.nextAllowedPollAt ? new Date(this.nextAllowedPollAt).toISOString() : null,
      secondsUntilNextPoll: Math.max(0, Math.round((this.nextAllowedPollAt - Date.now()) / 1e3)),
      cachedTransactionsCount: this.cachedTransactions.length,
      activeWatchersCount: this.activeWatchers.size
    };
  }
  /**
   * Register a global listener for any paid transaction
   */
  onPaymentPaid(listener) {
    this.paidListeners.add(listener);
    return () => {
      this.paidListeners.delete(listener);
    };
  }
  /**
   * Watch for a specific amountToPay. When paid, executes onPaid callback.
   * Auto-starts the poller if not already running.
   */
  watchPayment(amountToPay, onPaid, onExpire, timeoutMs = 3e5) {
    const timerId = setTimeout(() => {
      this.activeWatchers.delete(amountToPay);
      if (onExpire) {
        onExpire();
      }
    }, timeoutMs);
    this.activeWatchers.set(amountToPay, {
      amountToPay,
      onPaid,
      onExpire,
      timerId
    });
    if (!this.isRunningPoller) {
      this.startPoller();
    }
    return () => {
      clearTimeout(timerId);
      this.activeWatchers.delete(amountToPay);
    };
  }
};

// src/client.ts
var GoBiz = class {
  config;
  auth;
  payments;
  outlets;
  food;
  constructor(config) {
    if (!config.clientId || !config.clientSecret) {
      throw new GoBizError("clientId and clientSecret are mandatory to initialize GoBiz SDK", 400);
    }
    this.config = Object.freeze({
      timeout: 3e4,
      isProductionMode: false,
      ...config
    });
    this.auth = new GoAuthService(this.config);
    this.payments = new PaymentService(this.config, this.auth);
    this.outlets = new OutletService(this.config, this.auth);
    this.food = new FoodService(this.config, this.auth);
  }
  // --- Convenience Shortcuts ---
  /**
   * Create dynamic QRIS payment transaction (Open API)
   */
  async createPayment(outletId = this.config.outletId, payload, idempotencyKey) {
    if (!outletId) {
      throw new GoBizError("Outlet ID must be provided either in config or method call", 400);
    }
    return this.payments.createTransaction(outletId, payload, idempotencyKey);
  }
  /**
   * Inquire payment transaction status (Open API)
   */
  async getPayment(outletId = this.config.outletId, transactionId) {
    if (!outletId) {
      throw new GoBizError("Outlet ID must be provided either in config or method call", 400);
    }
    return this.payments.getTransaction(outletId, transactionId);
  }
  /**
   * List all linked outlets (Open API)
   */
  async getOutlets(page, pageSize) {
    return this.outlets.getAllLinkedOutlets(page, pageSize);
  }
  /**
   * Get single outlet detail (Open API)
   */
  async getOutlet(outletId) {
    return this.outlets.getOutlet(outletId);
  }
  /**
   * Mark GoFood order as ready in kitchen
   */
  async markOrderReady(outletId = this.config.outletId, orderId) {
    if (!outletId) {
      throw new GoBizError("Outlet ID must be provided either in config or method call", 400);
    }
    return this.food.markFoodReady(outletId, orderId);
  }
  /**
   * Get Active API Base URL
   */
  getApiBaseUrl() {
    return this.auth.getApiBaseUrl();
  }
  /**
   * Get Active OAuth Base URL
   */
  getOAuthBaseUrl() {
    return this.auth.getOAuthBaseUrl();
  }
  /**
   * Factory method to create a GoBizPortal instance for direct portal login & QRIS generation
   */
  static createPortal(config = {}) {
    return new GoBizPortalService(config);
  }
};
var GoBizPortal = GoBizPortalService;

// src/services/global-poller.service.ts
var GlobalPortalPoller = class _GlobalPortalPoller {
  static instance;
  minIntervalMs;
  maxIntervalMs;
  lastPolledAt = 0;
  nextAllowedPollAt = 0;
  cachedTransactions = [];
  activePollPromise = null;
  constructor(options = {}) {
    this.minIntervalMs = options.minIntervalMs || 3e4;
    this.maxIntervalMs = options.maxIntervalMs || 6e4;
    this.scheduleNextWindow();
  }
  static getInstance(options) {
    if (!_GlobalPortalPoller.instance) {
      _GlobalPortalPoller.instance = new _GlobalPortalPoller(options);
    }
    return _GlobalPortalPoller.instance;
  }
  getRandomIntervalMs() {
    return Math.floor(Math.random() * (this.maxIntervalMs - this.minIntervalMs + 1)) + this.minIntervalMs;
  }
  scheduleNextWindow() {
    const delay = this.getRandomIntervalMs();
    this.nextAllowedPollAt = Date.now() + delay;
  }
  /**
   * Fetches latest mutations with global deduplication and throttling
   */
  async getMutations(portal, force = false) {
    const now = Date.now();
    if (this.activePollPromise) {
      const list = await this.activePollPromise;
      return { transactions: list, fromCache: false, lastPolledAt: this.lastPolledAt };
    }
    if (!force && this.cachedTransactions.length > 0 && now < this.nextAllowedPollAt) {
      return {
        transactions: this.cachedTransactions,
        fromCache: true,
        lastPolledAt: this.lastPolledAt
      };
    }
    this.activePollPromise = (async () => {
      try {
        const list = await portal.getTransactions();
        this.cachedTransactions = list;
        this.lastPolledAt = Date.now();
        this.scheduleNextWindow();
        return list;
      } finally {
        this.activePollPromise = null;
      }
    })();
    const result = await this.activePollPromise;
    return { transactions: result, fromCache: false, lastPolledAt: this.lastPolledAt };
  }
  /**
   * Check settlement for a specific amount using global throttled mutations
   */
  async checkSettlement(portal, amountToPay, force = false) {
    const { transactions, fromCache, lastPolledAt } = await this.getMutations(portal, force);
    const match = transactions.find(
      (tx) => (tx.status === "SETTLEMENT" || tx.status === "CAPTURE") && Math.abs(tx.amount - amountToPay) === 0
    );
    const nextCheckInSeconds = Math.max(0, Math.round((this.nextAllowedPollAt - Date.now()) / 1e3));
    if (match) {
      return {
        paid: true,
        transaction: match,
        amountToPay,
        paidAt: match.settlement_time || match.transaction_time || new Date(lastPolledAt).toISOString(),
        fromCache,
        nextCheckInSeconds
      };
    }
    return {
      paid: false,
      amountToPay,
      fromCache,
      nextCheckInSeconds
    };
  }
  /**
   * Get poller state info
   */
  getStatus() {
    return {
      lastPolledAt: this.lastPolledAt ? new Date(this.lastPolledAt).toISOString() : null,
      nextAllowedPollAt: this.nextAllowedPollAt ? new Date(this.nextAllowedPollAt).toISOString() : null,
      cachedCount: this.cachedTransactions.length,
      isPollingActive: this.activePollPromise !== null
    };
  }
};
function generateWebhookSignature(secret, payload) {
  const content = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto2__default.default.createHmac("sha256", secret).update(content, "utf8").digest("hex");
}
function verifyWebhookSignature(secret, payload, signature) {
  if (!signature || typeof signature !== "string") return false;
  const expected = generateWebhookSignature(secret, payload);
  if (expected.length !== signature.length) return false;
  return crypto2__default.default.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

exports.BaseService = BaseService;
exports.FoodService = FoodService;
exports.GOBIZ_URLS = GOBIZ_URLS;
exports.GlobalPortalPoller = GlobalPortalPoller;
exports.GoAuthService = GoAuthService;
exports.GoBiz = GoBiz;
exports.GoBizError = GoBizError;
exports.GoBizPortal = GoBizPortal;
exports.GoBizPortalService = GoBizPortalService;
exports.GoBizScope = GoBizScope;
exports.GoFoodOrderStatus = GoFoodOrderStatus;
exports.OutletService = OutletService;
exports.PaymentService = PaymentService;
exports.PaymentTransactionStatus = PaymentTransactionStatus;
exports.PaymentType = PaymentType;
exports.buildDynamicQris = buildDynamicQris;
exports.crc16Ccitt = crc16Ccitt;
exports.generateWebhookSignature = generateWebhookSignature;
exports.verifyWebhookSignature = verifyWebhookSignature;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map