import { PaymentTransactionStatusType } from '../constants/index.js';

interface GoBizConfig {
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
interface GoBizApiErrorItem {
    code?: string;
    message_title: string;
    message: string;
    message_severity?: 'error' | 'warning' | 'info';
}
interface GoBizApiResponse<T = any> {
    success: boolean;
    data?: T;
    errors?: GoBizApiErrorItem[];
}

interface TransactionDetails {
    order_id: string;
    gross_amount: number;
    currency?: 'IDR' | string;
}
interface ItemDetail {
    id?: string;
    price: number;
    quantity: number;
    name: string;
    brand?: string;
    category?: string;
    merchant_name?: string | null;
}
interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
}
interface CreatePaymentTransactionRequest {
    payment_type: 'qris';
    transaction_details: TransactionDetails;
    item_details?: ItemDetail[];
    customer_details?: CustomerDetails;
    metadata?: Record<string, any>;
}
interface ActionDetail {
    name: string;
    method: string;
    url: string;
}
interface OutletReference {
    id: string;
    pop_id?: string;
}
interface PaymentTransactionData {
    id: string;
    payment_type: 'qris' | string;
    status: PaymentTransactionStatusType | string;
    qris_string: string;
    order_id: string;
    gross_amount: number;
    currency: string;
    created_at?: string;
    settlement_at?: string | null;
}
interface CreatePaymentTransactionResponse {
    outlet: OutletReference;
    transaction: PaymentTransactionData;
    actions: ActionDetail[];
}
interface GetPaymentTransactionResponse {
    outlet: OutletReference;
    transaction: PaymentTransactionData;
    actions: ActionDetail[];
}

interface OutletAddress {
    address?: string;
    city?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
}
interface OutletInfo {
    id: string;
    name: string;
    brand_name?: string;
    address?: OutletAddress;
    phone_number?: string;
    email?: string;
    status?: string;
    merchant_id?: string;
    pop_id?: string;
    created_at?: string;
    updated_at?: string;
}
interface LinkedOutletsResponse {
    outlets: OutletInfo[];
    page_info?: {
        page: number;
        page_size: number;
        total_count: number;
    };
}
interface LinkOutletRequest {
    outlet_id: string;
    product?: string;
}

interface MenuItem {
    id: string;
    name: string;
    price: number;
    description?: string;
    in_stock: boolean;
    category_id?: string;
    image_url?: string;
}
interface MenuCategory {
    id: string;
    name: string;
    items: MenuItem[];
}
interface FoodCatalog {
    categories: MenuCategory[];
}
interface GoFoodOrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
}
interface GoFoodOrder {
    order_id: string;
    outlet_id: string;
    status: string;
    items: GoFoodOrderItem[];
    total_amount: number;
    customer_name?: string;
    customer_phone?: string;
    driver_name?: string;
    driver_phone?: string;
    created_at: string;
}

type GoBizPortalAuthMethod = 'password' | 'cookie';
type QrisRoundingMode = 'up' | 'down';
interface GoBizPortalConfig {
    authMethod?: GoBizPortalAuthMethod;
    email?: string;
    password?: string;
    token?: string;
    merchantId?: string;
    staticQris?: string;
    uniqueCodeDigits?: 2 | 3;
    uniqueCodeMin?: number;
    uniqueCodeMax?: number;
    roundingMode?: QrisRoundingMode;
    pollIntervalMinMs?: number;
    pollIntervalMaxMs?: number;
    webhookUrl?: string;
    webhookSecret?: string;
    timeout?: number;
    fetch?: typeof globalThis.fetch;
}
interface PortalMerchantInfo {
    id: string;
    name: string;
    email?: string;
    phone_number?: string;
    status?: string;
    outlets?: Array<{
        id: string;
        name: string;
        address?: string;
    }>;
}
interface PortalTransactionItem {
    id: string;
    order_id?: string;
    amount: number;
    payment_type: string;
    status: 'SETTLEMENT' | 'CAPTURE' | 'PENDING' | 'REFUND' | string;
    transaction_time: string;
    settlement_time?: string;
    outlet_id?: string;
}
interface DynamicPaymentOrder {
    trxId: string;
    amount: number;
    fee: number;
    uniqueCode: number;
    roundingMode: QrisRoundingMode;
    amountToPay: number;
    qrisString: string;
    qrImageUrl: string;
    expiresAt: string;
    metadata?: Record<string, any>;
    callbackUrl?: string;
}
interface SettlementCheckResult {
    paid: boolean;
    transaction?: PortalTransactionItem;
    amountToPay: number;
    paidAt?: string;
    fromCache?: boolean;
    nextCheckInSeconds?: number;
}
interface PollerStatus {
    isRunning: boolean;
    lastPolledAt: string | null;
    nextAllowedPollAt: string | null;
    secondsUntilNextPoll: number;
    cachedTransactionsCount: number;
    activeWatchersCount: number;
}
type PaymentPaidListener = (tx: PortalTransactionItem) => void;

interface OAuthTokenRequest {
    grant_type: 'client_credentials';
    scope: string;
}
interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}
interface CachedToken {
    accessToken: string;
    tokenType: string;
    expiresAt: number;
    scope: string;
}

export type { ActionDetail, CachedToken, CreatePaymentTransactionRequest, CreatePaymentTransactionResponse, CustomerDetails, DynamicPaymentOrder, FoodCatalog, GetPaymentTransactionResponse, GoBizApiErrorItem, GoBizApiResponse, GoBizConfig, GoBizPortalAuthMethod, GoBizPortalConfig, GoFoodOrder, GoFoodOrderItem, ItemDetail, LinkOutletRequest, LinkedOutletsResponse, MenuCategory, MenuItem, OAuthTokenRequest, OAuthTokenResponse, OutletAddress, OutletInfo, OutletReference, PaymentPaidListener, PaymentTransactionData, PollerStatus, PortalMerchantInfo, PortalTransactionItem, QrisRoundingMode, SettlementCheckResult, TransactionDetails };
