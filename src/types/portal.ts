export type GoBizPortalAuthMethod = 'password' | 'cookie';
export type QrisRoundingMode = 'up' | 'down';

export interface GoBizPortalConfig {
  authMethod?: GoBizPortalAuthMethod;
  email?: string;
  password?: string;
  token?: string; // Cookie access_token
  merchantId?: string;
  staticQris?: string;
  uniqueCodeDigits?: 2 | 3;
  uniqueCodeMin?: number;
  uniqueCodeMax?: number;
  roundingMode?: QrisRoundingMode; // 'up' (add code) or 'down' (subtract code)
  pollIntervalMinMs?: number; // default: 30_000 (30s)
  pollIntervalMaxMs?: number; // default: 240_000 (240s)
  webhookUrl?: string;
  webhookSecret?: string;
  timeout?: number;
  onTokenUpdate?: (token: string) => Promise<void> | void;
  fetch?: typeof globalThis.fetch;
}

export interface PortalMerchantInfo {
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

export interface PortalTransactionItem {
  id: string;
  order_id?: string;
  amount: number;
  payment_type: string;
  status: 'SETTLEMENT' | 'CAPTURE' | 'PENDING' | 'REFUND' | string;
  transaction_time: string;
  settlement_time?: string;
  outlet_id?: string;
}

export interface DynamicPaymentOrder {
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

export interface SettlementCheckResult {
  paid: boolean;
  transaction?: PortalTransactionItem;
  amountToPay: number;
  paidAt?: string;
  fromCache?: boolean;
  nextCheckInSeconds?: number;
}

export interface PollerStatus {
  isRunning: boolean;
  lastPolledAt: string | null;
  nextAllowedPollAt: string | null;
  secondsUntilNextPoll: number;
  cachedTransactionsCount: number;
  activeWatchersCount: number;
}

export type PaymentPaidListener = (tx: PortalTransactionItem) => void;
