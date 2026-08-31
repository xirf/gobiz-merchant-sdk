import crypto from 'node:crypto';
import type {
  GoBizPortalConfig,
  PortalMerchantInfo,
  PortalTransactionItem,
  DynamicPaymentOrder,
  SettlementCheckResult,
  PollerStatus,
  PaymentPaidListener,
} from '../types/portal.js';
import { buildDynamicQris } from '../utils/qris.js';
import { GoBizError } from '../errors/gobiz-error.js';

const BASE_URL = 'https://api.gobiz.co.id';
const ANALYTICS_URL = 'https://api.gojekapi.com/merchant-analytics/v2/merchants/transactions';
const CLIENT_ID = 'go-biz-web-new';

interface ActiveWatcher {
  amountToPay: number;
  onPaid: (tx: PortalTransactionItem) => void;
  onExpire?: () => void;
  timerId: any;
}

export class GoBizPortalService {
  public config: GoBizPortalConfig;
  private token: string | null = null;
  private merchantId: string | null = null;
  private uniqueCodeCursor: number = 1;

  // --- Native Global Poller & Deduplication Engine ---
  private pollIntervalMinMs: number;
  private pollIntervalMaxMs: number;
  private lastPolledAt: number = 0;
  private nextAllowedPollAt: number = 0;
  private cachedTransactions: PortalTransactionItem[] = [];
  private activePollPromise: Promise<PortalTransactionItem[]> | null = null;

  // Background Poller State
  private pollerTimerId: any = null;
  private isRunningPoller: boolean = false;
  private paidListeners: Set<PaymentPaidListener> = new Set();
  private activeWatchers: Map<number, ActiveWatcher> = new Map();

  constructor(config: GoBizPortalConfig = {}) {
    const digits = config.uniqueCodeDigits || 3;
    const defaultMin = digits === 2 ? 10 : 100;
    const defaultMax = digits === 2 ? 99 : 999;

    this.pollIntervalMinMs = config.pollIntervalMinMs || 30000; // 30s
    this.pollIntervalMaxMs = config.pollIntervalMaxMs || 240000; // 240s (4 mins)

    this.config = {
      authMethod: config.authMethod || (config.token ? 'cookie' : 'password'),
      uniqueCodeDigits: digits,
      uniqueCodeMin: config.uniqueCodeMin ?? defaultMin,
      uniqueCodeMax: config.uniqueCodeMax ?? defaultMax,
      roundingMode: config.roundingMode || 'up',
      pollIntervalMinMs: this.pollIntervalMinMs,
      pollIntervalMaxMs: this.pollIntervalMaxMs,
      timeout: config.timeout || 30000,
      ...config,
    };

    this.uniqueCodeCursor = this.config.uniqueCodeMin || defaultMin;

    if (config.token) {
      this.token = config.token;
    }
    if (config.merchantId) {
      this.merchantId = config.merchantId;
    }
  }

  private getRandomIntervalMs(): number {
    return (
      Math.floor(Math.random() * (this.pollIntervalMaxMs - this.pollIntervalMinMs + 1)) +
      this.pollIntervalMinMs
    );
  }

  private scheduleNextWindow(): void {
    const delay = this.getRandomIntervalMs();
    this.nextAllowedPollAt = Date.now() + delay;
  }

  /**
   * Returns portal browser-mimicking headers for GoBiz web APIs
   */
  private deviceId: string = crypto.randomUUID();

  private getPortalHeaders(accessToken?: string): Record<string, string> {
    const tokenToUse = accessToken || this.token;
    return {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'id',
      'Authentication-Type': 'go-id',
      Authorization: tokenToUse ? `Bearer ${tokenToUse}` : 'Bearer',
      'Content-Type': 'application/json',
      'Gojek-Country-Code': 'ID',
      'Gojek-Timezone': 'Asia/Jakarta',
      Origin: 'https://portal.gofoodmerchant.co.id',
      Referer: 'https://portal.gofoodmerchant.co.id/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      'X-AppVersion': 'platform-v3.107.0-94ce5d57',
      'X-PhoneMake': 'Windows 10 64-bit',
      'X-PhoneModel': 'Chrome 149.0.0.0 on Windows 10 64-bit',
      'X-Platform': 'Web',
      'X-User-Locale': 'en-US',
      'X-User-Type': 'merchant',
      'sec-ch-ua': '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'x-DeviceOS': 'Web',
      'x-appId': 'go-biz-web-dashboard',
      'x-uniqueid': this.deviceId,
    };
  }

  private async postJson(url: string, headers: Record<string, string>, payload: any): Promise<any> {
    const fetchFn = this.config.fetch || globalThis.fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetchFn(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const text = await response.text();
      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      if (!response.ok) {
        throw GoBizError.fromResponse(response.status, body, url, 'POST', payload);
      }
      return body;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async getJson(url: string, headers: Record<string, string>): Promise<any> {
    const fetchFn = this.config.fetch || globalThis.fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetchFn(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      const text = await response.text();
      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      if (!response.ok) {
        throw GoBizError.fromResponse(response.status, body, url, 'GET');
      }
      return body;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Log into GoBiz Merchant Portal using Email and Password
   */
  public async loginWithPassword(email?: string, password?: string): Promise<string> {
    const targetEmail = email || this.config.email;
    const targetPassword = password || this.config.password;

    if (!targetEmail || !targetPassword) {
      throw new Error('Email and Password are required for GoBiz portal password login.');
    }

    const headers = this.getPortalHeaders();

    // Step 1: Advisory validation check
    try {
      const validation = await this.postJson(`${BASE_URL}/goid/login/request`, headers, {
        email: targetEmail,
        login_type: 'password',
        client_id: CLIENT_ID,
      });

      if (validation?.errors?.length > 0) {
        const msg = validation.errors[0]?.message || '';
        if (/terlalu banyak|too many|rate.?limit|coba lagi|try again/i.test(msg)) {
          throw new Error(`GoBiz login rate-limited: ${msg}`);
        }
      }
    } catch (err: any) {
      if (err.message && /terlalu banyak|too many|rate.?limit|coba lagi|try again/i.test(err.message)) {
        throw err;
      }
      // Non-fatal if login/request is advisory
    }

    // Step 2: Request token
    const tokenPayload = {
      client_id: CLIENT_ID,
      grant_type: 'password',
      data: {
        email: targetEmail,
        password: targetPassword,
      },
    };

    const tokenRes = await this.postJson(`${BASE_URL}/goid/token`, headers, tokenPayload);

    if (tokenRes?.errors?.length > 0) {
      const msg = tokenRes.errors[0]?.message || 'Password authentication failed';
      throw new Error(`GoBiz Login Error: ${msg}`);
    }

    const accessToken = tokenRes.access_token || tokenRes.data?.access_token;
    if (!accessToken) {
      throw new Error('GoBiz did not return an access_token');
    }

    this.token = accessToken;
    return this.token!;
  }

  /**
   * Set or update the access token (e.g. from browser cookie)
   */
  public setCookieToken(token: string): void {
    this.token = token;
    this.config.token = token;
    this.config.authMethod = 'cookie';
  }

  /**
   * Retrieves active access token, automatically logging in if needed
   */
  public async getAccessToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    if (this.config.authMethod === 'password' || (this.config.email && this.config.password)) {
      return this.loginWithPassword();
    }

    throw new Error('No GoBiz portal session available. Provide cookie access_token or email & password.');
  }

  /**
   * Fetches logged-in merchant profile and linked outlets
   */
  public async getMerchantProfile(): Promise<PortalMerchantInfo> {
    const token = await this.getAccessToken();
    const headers = this.getPortalHeaders(token);

    const res = await this.getJson(`${BASE_URL}/v1/merchants/self`, headers);
    const data = res.data || res;

    if (data.id) {
      this.merchantId = data.id;
    }

    return {
      id: data.id,
      name: data.name || data.merchant_name || 'GoBiz Merchant',
      email: data.email,
      phone_number: data.phone_number,
      status: data.status,
      outlets: data.outlets || [],
    };
  }

  /**
   * Raw low-level fetch for GoBiz Merchant Analytics transactions
   */
  private async fetchRawTransactions(options: { from?: string; to?: string } = {}): Promise<PortalTransactionItem[]> {
    const token = await this.getAccessToken();
    const headers = this.getPortalHeaders(token);

    let merchantId = this.merchantId || this.config.merchantId;
    if (!merchantId) {
      try {
        const profile = await this.getMerchantProfile();
        merchantId = profile.id;
      } catch {
        // Continue if profile fails
      }
    }

    const from =
      options.from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const to = options.to || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    const queryParams = new URLSearchParams({
      start_time: from,
      end_time: to,
      from: '0',
      limit: '50',
    });

    if (merchantId) {
      queryParams.append('merchant_id', merchantId);
    }

    const url = `${ANALYTICS_URL}?${queryParams.toString()}`;
    const res = await this.getJson(url, headers);

    const rawList = Array.isArray(res) ? res : res.data || res.transactions || [];

    return rawList.map((item: any) => {
      const rawGross = Number(item.gross_amount ?? item.amount ?? 0);
      // GoBiz analytics gross_amount is provided in cents (multiplied by 100)
      const amount = rawGross >= 100000 ? Math.round(rawGross / 100) : rawGross;

      return {
        id: item.id || item.transaction_id,
        order_id: item.order_id,
        amount,
        payment_type: (item.payment_type || 'QRIS').toUpperCase(),
        status: (item.transaction_status || item.status || 'SETTLEMENT').toUpperCase(),
        transaction_time: item.transaction_time || item.created_at,
        settlement_time: item.settlement_time || item.settlement_at,
        outlet_id: item.outlet_id,
      };
    });
  }

  /**
   * Fetches latest mutations with global deduplication and throttling across all callers
   */
  public async getTransactions(options: { force?: boolean; from?: string; to?: string } = {}): Promise<PortalTransactionItem[]> {
    const now = Date.now();

    // 1. Deduplicate concurrent in-flight requests (joins existing promise)
    if (this.activePollPromise) {
      return this.activePollPromise;
    }

    // 2. Return cached mutations if within the randomized window after a previous poll
    if (!options.force && this.lastPolledAt > 0 && now < this.nextAllowedPollAt) {
      return this.cachedTransactions;
    }

    // 3. Initiate single upstream HTTP poll
    this.activePollPromise = (async () => {
      try {
        const list = await this.fetchRawTransactions(options);
        this.cachedTransactions = list;
        this.lastPolledAt = Date.now();
        this.scheduleNextWindow();

        // Notify active watchers & listeners
        this.notifyWatchers(list);

        return list;
      } catch (err) {
        // Backoff: schedule next window so concurrent caller ticks don't hammer upstream
        this.lastPolledAt = Date.now();
        this.scheduleNextWindow();
        throw err;
      } finally {
        this.activePollPromise = null;
      }
    })();

    return this.activePollPromise;
  }

  /**
   * Internal helper to notify registered listeners and watchers
   */
  private notifyWatchers(transactions: PortalTransactionItem[]): void {
    for (const tx of transactions) {
      if (tx.status === 'SETTLEMENT' || tx.status === 'CAPTURE') {
        // Fire global paid listeners
        for (const listener of this.paidListeners) {
          try {
            listener(tx);
          } catch (err) {
            console.error('Error in GoBizPortal onPaymentPaid listener:', err);
          }
        }

        // Fire single transaction watcher
        const watcher = this.activeWatchers.get(tx.amount);
        if (watcher) {
          clearTimeout(watcher.timerId);
          this.activeWatchers.delete(tx.amount);
          try {
            watcher.onPaid(tx);
          } catch (err) {
            console.error('Error in GoBizPortal watchPayment callback:', err);
          }
        }
      }
    }
  }

  /**
   * Generates a dynamic QRIS payment with unique nominal code (2 digits: 10..99 or 3 digits: 100..999)
   */
  public createDynamicPayment(params: {
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
  }): DynamicPaymentOrder {
    const staticQris = params.staticQris || this.config.staticQris;
    if (!staticQris) {
      throw new Error(
        'Static QRIS string is required. Please provide it in options or configure staticQris in GoBizPortal.',
      );
    }

    const baseAmount = params.amount;
    const fee = params.fee || 0;
    const roundingMode = params.roundingMode || this.config.roundingMode || 'up';

    let uniqueCode: number;

    if (params.uniqueCode !== undefined) {
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

    const amountToPay = roundingMode === 'down'
      ? Math.max(1000, baseAmount + fee - uniqueCode)
      : (baseAmount + fee + uniqueCode);

    const qrisString = buildDynamicQris(staticQris, amountToPay);
    const trxId = params.trxId || `TRX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const expireMinutes = params.expireMinutes || 5;
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000).toISOString();

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
      callbackUrl: params.callbackUrl || this.config.webhookUrl,
    };
  }

  /**
   * Checks if an incoming payment mutation matches the target exact amount
   */
  public async checkSettlement(
    amountToPay: number,
    options: { force?: boolean } = {},
  ): Promise<SettlementCheckResult> {
    const transactions = await this.getTransactions({ force: options.force });

    const match = transactions.find(
      (tx) =>
        (tx.status === 'SETTLEMENT' || tx.status === 'CAPTURE') &&
        Math.abs(tx.amount - amountToPay) === 0,
    );

    const secondsUntilNextPoll = Math.max(0, Math.round((this.nextAllowedPollAt - Date.now()) / 1000));

    if (match) {
      return {
        paid: true,
        transaction: match,
        amountToPay,
        paidAt: match.settlement_time || match.transaction_time || new Date().toISOString(),
        fromCache: Date.now() < this.nextAllowedPollAt,
        nextCheckInSeconds: secondsUntilNextPoll,
      };
    }

    return {
      paid: false,
      amountToPay,
      fromCache: Date.now() < this.nextAllowedPollAt,
      nextCheckInSeconds: secondsUntilNextPoll,
    };
  }

  // --- NATIVE GLOBAL POLLER METHODS ---

  /**
   * Starts the embedded background poller (single instance per portal client).
   * Polls GoBiz periodically with randomized 30s-60s jitter.
   */
  public startPoller(onPaid?: PaymentPaidListener): void {
    if (onPaid) {
      this.paidListeners.add(onPaid);
    }

    if (this.isRunningPoller) {
      return;
    }

    this.isRunningPoller = true;
    this.scheduleNextPollerTick();
  }

  private scheduleNextPollerTick(): void {
    if (!this.isRunningPoller) return;

    const delay = this.getRandomIntervalMs();
    this.pollerTimerId = setTimeout(async () => {
      if (!this.isRunningPoller) return;

      try {
        await this.getTransactions({ force: true });
      } catch (err) {
        console.error('GoBizPortal background poller error:', err);
      } finally {
        this.scheduleNextPollerTick();
      }
    }, delay);
  }

  /**
   * Stops the background poller
   */
  public stopPoller(): void {
    this.isRunningPoller = false;
    if (this.pollerTimerId) {
      clearTimeout(this.pollerTimerId);
      this.pollerTimerId = null;
    }
  }

  /**
   * Checks if background poller is running
   */
  public isPollerRunning(): boolean {
    return this.isRunningPoller;
  }

  /**
   * Returns current poller status
   */
  public getPollerStatus(): PollerStatus {
    return {
      isRunning: this.isRunningPoller,
      lastPolledAt: this.lastPolledAt ? new Date(this.lastPolledAt).toISOString() : null,
      nextAllowedPollAt: this.nextAllowedPollAt ? new Date(this.nextAllowedPollAt).toISOString() : null,
      secondsUntilNextPoll: Math.max(0, Math.round((this.nextAllowedPollAt - Date.now()) / 1000)),
      cachedTransactionsCount: this.cachedTransactions.length,
      activeWatchersCount: this.activeWatchers.size,
    };
  }

  /**
   * Register a global listener for any paid transaction
   */
  public onPaymentPaid(listener: PaymentPaidListener): () => void {
    this.paidListeners.add(listener);
    return () => {
      this.paidListeners.delete(listener);
    };
  }

  /**
   * Watch for a specific amountToPay. When paid, executes onPaid callback.
   * Auto-starts the poller if not already running.
   */
  public watchPayment(
    amountToPay: number,
    onPaid: (tx: PortalTransactionItem) => void,
    onExpire?: () => void,
    timeoutMs: number = 300000, // 5 mins
  ): () => void {
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
      timerId,
    });

    // Auto-start background poller if needed
    if (!this.isRunningPoller) {
      this.startPoller();
    }

    // Return unwatch function
    return () => {
      clearTimeout(timerId);
      this.activeWatchers.delete(amountToPay);
    };
  }
}
