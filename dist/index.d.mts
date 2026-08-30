import { GoBizConfig, CreatePaymentTransactionRequest, CreatePaymentTransactionResponse, GetPaymentTransactionResponse, LinkedOutletsResponse, OutletInfo, LinkOutletRequest, FoodCatalog, GoBizPortalConfig, PortalMerchantInfo, PortalTransactionItem, DynamicPaymentOrder, SettlementCheckResult, PaymentPaidListener, PollerStatus, GoBizApiErrorItem } from './types/index.mjs';
export { ActionDetail, CachedToken, CustomerDetails, GoBizApiResponse, GoBizPortalAuthMethod, GoFoodOrder, GoFoodOrderItem, ItemDetail, MenuCategory, MenuItem, OAuthTokenRequest, OAuthTokenResponse, OutletAddress, OutletReference, PaymentTransactionData, QrisRoundingMode, TransactionDetails } from './types/index.mjs';
export { GOBIZ_URLS, GoBizScope, GoBizScopeType, GoFoodOrderStatus, GoFoodOrderStatusType, PaymentTransactionStatus, PaymentTransactionStatusType, PaymentType, PaymentTypeType } from './constants/index.mjs';

declare class GoAuthService {
    private config;
    private tokenCache;
    private pendingRequests;
    constructor(config: GoBizConfig);
    getOAuthBaseUrl(): string;
    getApiBaseUrl(): string;
    /**
     * Get an active access token for specified scope(s).
     * Caches tokens in memory, pre-emptively refreshes near expiry, and deduplicates concurrent calls.
     */
    getAccessToken(scope?: string): Promise<string>;
    private fetchNewToken;
    /**
     * Clear all cached access tokens
     */
    clearCache(): void;
}

interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    scope: string;
    body?: any;
    queryParams?: Record<string, string | number | boolean | undefined>;
    idempotencyKey?: string;
    customHeaders?: Record<string, string>;
}
declare abstract class BaseService {
    protected config: GoBizConfig;
    protected auth: GoAuthService;
    constructor(config: GoBizConfig, auth: GoAuthService);
    protected request<T>(options: RequestOptions): Promise<T>;
}

declare class PaymentService extends BaseService {
    /**
     * Create a dynamic QRIS payment transaction for an outlet.
     *
     * @param outletId - The Outlet ID where the transaction will be recorded
     * @param payload - Transaction details, items, customer info
     * @param idempotencyKey - Unique idempotency string (max 32 characters)
     */
    createTransaction(outletId: string, payload: CreatePaymentTransactionRequest, idempotencyKey?: string): Promise<CreatePaymentTransactionResponse>;
    /**
     * Get details and live status of a payment transaction.
     *
     * @param outletId - The Outlet ID
     * @param transactionId - The ID of the transaction
     */
    getTransaction(outletId: string, transactionId: string): Promise<GetPaymentTransactionResponse>;
    /**
     * Extract QR Code image URL from transaction response action list
     */
    getQrCodeUrl(response: CreatePaymentTransactionResponse | GetPaymentTransactionResponse): string | null;
    private generateIdempotencyKey;
}

declare class OutletService extends BaseService {
    /**
     * Get list of all linked merchant outlets
     */
    getAllLinkedOutlets(page?: number, pageSize?: number): Promise<LinkedOutletsResponse>;
    /**
     * Get detailed information about a specific outlet
     */
    getOutlet(outletId: string): Promise<OutletInfo>;
    /**
     * Get authenticated outlet information based on the current access token
     */
    getTokenInfo(): Promise<OutletInfo>;
    /**
     * Link an outlet to partner integration
     */
    linkOutlet(payload: LinkOutletRequest): Promise<any>;
    /**
     * Unlink an outlet from partner integration
     */
    unlinkOutlet(payload: LinkOutletRequest): Promise<any>;
}

declare class FoodService extends BaseService {
    /**
     * Sync/Push updated GoFood menu catalog for an outlet
     */
    syncMenu(outletId: string, catalog: FoodCatalog): Promise<any>;
    /**
     * Mark a GoFood kitchen order as prepared/ready for driver pickup
     */
    markFoodReady(outletId: string, orderId: string): Promise<any>;
    /**
     * Accept an incoming GoFood order
     */
    acceptOrder(outletId: string, orderId: string): Promise<any>;
    /**
     * Get restaurant properties (opening hours, auto-accept status)
     */
    getOutletProperties(outletId: string): Promise<any>;
    /**
     * Get active promotions for an outlet
     */
    getPromotions(outletId: string): Promise<any>;
}

declare class GoBizPortalService {
    config: GoBizPortalConfig;
    private token;
    private merchantId;
    private uniqueCodeCursor;
    private pollIntervalMinMs;
    private pollIntervalMaxMs;
    private lastPolledAt;
    private nextAllowedPollAt;
    private cachedTransactions;
    private activePollPromise;
    private pollerTimerId;
    private isRunningPoller;
    private paidListeners;
    private activeWatchers;
    constructor(config?: GoBizPortalConfig);
    private getRandomIntervalMs;
    private scheduleNextWindow;
    /**
     * Returns portal browser-mimicking headers for GoBiz web APIs
     */
    private getPortalHeaders;
    private postJson;
    private getJson;
    /**
     * Log into GoBiz Merchant Portal using Email and Password
     */
    loginWithPassword(email?: string, password?: string): Promise<string>;
    /**
     * Set or update the access token (e.g. from browser cookie)
     */
    setCookieToken(token: string): void;
    /**
     * Retrieves active access token, automatically logging in if needed
     */
    getAccessToken(): Promise<string>;
    /**
     * Fetches logged-in merchant profile and linked outlets
     */
    getMerchantProfile(): Promise<PortalMerchantInfo>;
    /**
     * Raw low-level fetch for GoBiz Merchant Analytics transactions
     */
    private fetchRawTransactions;
    /**
     * Fetches latest mutations with global deduplication and throttling across all callers
     */
    getTransactions(options?: {
        force?: boolean;
        from?: string;
        to?: string;
    }): Promise<PortalTransactionItem[]>;
    /**
     * Internal helper to notify registered listeners and watchers
     */
    private notifyWatchers;
    /**
     * Generates a dynamic QRIS payment with unique nominal code (2 digits: 10..99 or 3 digits: 100..999)
     */
    createDynamicPayment(params: {
        amount: number;
        fee?: number;
        trxId?: string;
        staticQris?: string;
        uniqueCode?: number;
        uniqueCodeDigits?: 2 | 3;
        roundingMode?: 'up' | 'down';
        expireMinutes?: number;
        metadata?: Record<string, any>;
        callbackUrl?: string;
    }): DynamicPaymentOrder;
    /**
     * Checks if an incoming payment mutation matches the target exact amount
     */
    checkSettlement(amountToPay: number, options?: {
        force?: boolean;
    }): Promise<SettlementCheckResult>;
    /**
     * Starts the embedded background poller (single instance per portal client).
     * Polls GoBiz periodically with randomized 30s-60s jitter.
     */
    startPoller(onPaid?: PaymentPaidListener): void;
    private scheduleNextPollerTick;
    /**
     * Stops the background poller
     */
    stopPoller(): void;
    /**
     * Checks if background poller is running
     */
    isPollerRunning(): boolean;
    /**
     * Returns current poller status
     */
    getPollerStatus(): PollerStatus;
    /**
     * Register a global listener for any paid transaction
     */
    onPaymentPaid(listener: PaymentPaidListener): () => void;
    /**
     * Watch for a specific amountToPay. When paid, executes onPaid callback.
     * Auto-starts the poller if not already running.
     */
    watchPayment(amountToPay: number, onPaid: (tx: PortalTransactionItem) => void, onExpire?: () => void, timeoutMs?: number): () => void;
}

declare class GoBiz {
    readonly config: Readonly<GoBizConfig>;
    readonly auth: GoAuthService;
    readonly payments: PaymentService;
    readonly outlets: OutletService;
    readonly food: FoodService;
    constructor(config: GoBizConfig);
    /**
     * Create dynamic QRIS payment transaction (Open API)
     */
    createPayment(outletId: string | undefined, payload: CreatePaymentTransactionRequest, idempotencyKey?: string): Promise<CreatePaymentTransactionResponse>;
    /**
     * Inquire payment transaction status (Open API)
     */
    getPayment(outletId: string | undefined, transactionId: string): Promise<GetPaymentTransactionResponse>;
    /**
     * List all linked outlets (Open API)
     */
    getOutlets(page?: number, pageSize?: number): Promise<LinkedOutletsResponse>;
    /**
     * Get single outlet detail (Open API)
     */
    getOutlet(outletId: string): Promise<OutletInfo>;
    /**
     * Mark GoFood order as ready in kitchen
     */
    markOrderReady(outletId: string | undefined, orderId: string): Promise<any>;
    /**
     * Get Active API Base URL
     */
    getApiBaseUrl(): string;
    /**
     * Get Active OAuth Base URL
     */
    getOAuthBaseUrl(): string;
    /**
     * Factory method to create a GoBizPortal instance for direct portal login & QRIS generation
     */
    static createPortal(config?: GoBizPortalConfig): GoBizPortalService;
}
declare const GoBizPortal: typeof GoBizPortalService;

declare class GoBizError extends Error {
    readonly status: number;
    readonly errors: GoBizApiErrorItem[];
    readonly rawBody?: any;
    constructor(message: string, status?: number, errors?: GoBizApiErrorItem[], rawBody?: any);
    static fromResponse(status: number, body: any): GoBizError;
}

interface GlobalPollerOptions {
    minIntervalMs?: number;
    maxIntervalMs?: number;
}
/**
 * Global Poller Coordinator (Singleton).
 *
 * Ensures that across all incoming user requests / browser tabs, ONLY ONE
 * request ever hits the GoBiz upstream API within the randomized 30-60 second window.
 * All other concurrent or rapid checks reuse the shared in-flight promise or cached mutations.
 */
declare class GlobalPortalPoller {
    private static instance;
    private minIntervalMs;
    private maxIntervalMs;
    private lastPolledAt;
    private nextAllowedPollAt;
    private cachedTransactions;
    private activePollPromise;
    constructor(options?: GlobalPollerOptions);
    static getInstance(options?: GlobalPollerOptions): GlobalPortalPoller;
    private getRandomIntervalMs;
    private scheduleNextWindow;
    /**
     * Fetches latest mutations with global deduplication and throttling
     */
    getMutations(portal: GoBizPortalService, force?: boolean): Promise<{
        transactions: PortalTransactionItem[];
        fromCache: boolean;
        lastPolledAt: number;
    }>;
    /**
     * Check settlement for a specific amount using global throttled mutations
     */
    checkSettlement(portal: GoBizPortalService, amountToPay: number, force?: boolean): Promise<SettlementCheckResult & {
        fromCache: boolean;
        nextCheckInSeconds: number;
    }>;
    /**
     * Get poller state info
     */
    getStatus(): {
        lastPolledAt: string | null;
        nextAllowedPollAt: string | null;
        cachedCount: number;
        isPollingActive: boolean;
    };
}

/**
 * Calculates uppercase 4-character hex CRC16-CCITT checksum of a payload string
 */
declare function crc16Ccitt(payload: string): string;
/**
 * Converts a static QRIS string into a dynamic QRIS string with a fixed transaction amount.
 *
 * @param staticQris - The raw static QRIS string from GoBiz merchant portal
 * @param amount - The exact amount to pay (in IDR integer)
 * @returns The new dynamic QRIS string with Tag 54 (amount) and updated CRC16 checksum
 */
declare function buildDynamicQris(staticQris: string, amount: number): string;

/**
 * Generates an HMAC-SHA256 signature for webhook payloads
 */
declare function generateWebhookSignature(secret: string, payload: string | object): string;
/**
 * Verifies if an incoming webhook signature matches the payload using constant-time comparison
 */
declare function verifyWebhookSignature(secret: string, payload: string | object, signature: string): boolean;

export { BaseService, CreatePaymentTransactionRequest, CreatePaymentTransactionResponse, DynamicPaymentOrder, FoodCatalog, FoodService, GetPaymentTransactionResponse, type GlobalPollerOptions, GlobalPortalPoller, GoAuthService, GoBiz, GoBizApiErrorItem, GoBizConfig, GoBizError, GoBizPortal, GoBizPortalConfig, GoBizPortalService, LinkOutletRequest, LinkedOutletsResponse, OutletInfo, OutletService, PaymentPaidListener, PaymentService, PollerStatus, PortalMerchantInfo, PortalTransactionItem, type RequestOptions, SettlementCheckResult, buildDynamicQris, crc16Ccitt, generateWebhookSignature, verifyWebhookSignature };
