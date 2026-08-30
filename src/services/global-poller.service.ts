import type { GoBizPortalService } from './portal.service.js';
import type { PortalTransactionItem, SettlementCheckResult } from '../types/portal.js';

export interface GlobalPollerOptions {
  minIntervalMs?: number; // default: 30_000 (30s)
  maxIntervalMs?: number; // default: 60_000 (60s)
}

/**
 * Global Poller Coordinator (Singleton).
 *
 * Ensures that across all incoming user requests / browser tabs, ONLY ONE
 * request ever hits the GoBiz upstream API within the randomized 30-60 second window.
 * All other concurrent or rapid checks reuse the shared in-flight promise or cached mutations.
 */
export class GlobalPortalPoller {
  private static instance: GlobalPortalPoller;

  private minIntervalMs: number;
  private maxIntervalMs: number;
  private lastPolledAt: number = 0;
  private nextAllowedPollAt: number = 0;
  private cachedTransactions: PortalTransactionItem[] = [];
  private activePollPromise: Promise<PortalTransactionItem[]> | null = null;

  constructor(options: GlobalPollerOptions = {}) {
    this.minIntervalMs = options.minIntervalMs || 30000;
    this.maxIntervalMs = options.maxIntervalMs || 60000;
    this.scheduleNextWindow();
  }

  public static getInstance(options?: GlobalPollerOptions): GlobalPortalPoller {
    if (!GlobalPortalPoller.instance) {
      GlobalPortalPoller.instance = new GlobalPortalPoller(options);
    }
    return GlobalPortalPoller.instance;
  }

  private getRandomIntervalMs(): number {
    return (
      Math.floor(Math.random() * (this.maxIntervalMs - this.minIntervalMs + 1)) +
      this.minIntervalMs
    );
  }

  private scheduleNextWindow(): void {
    const delay = this.getRandomIntervalMs();
    this.nextAllowedPollAt = Date.now() + delay;
  }

  /**
   * Fetches latest mutations with global deduplication and throttling
   */
  public async getMutations(
    portal: GoBizPortalService,
    force: boolean = false,
  ): Promise<{ transactions: PortalTransactionItem[]; fromCache: boolean; lastPolledAt: number }> {
    const now = Date.now();

    // 1. If a poll is currently in flight by another request, deduplicate and join it!
    if (this.activePollPromise) {
      const list = await this.activePollPromise;
      return { transactions: list, fromCache: false, lastPolledAt: this.lastPolledAt };
    }

    // 2. If recent data is available and we haven't reached the next random window yet, return cache!
    if (!force && this.cachedTransactions.length > 0 && now < this.nextAllowedPollAt) {
      return {
        transactions: this.cachedTransactions,
        fromCache: true,
        lastPolledAt: this.lastPolledAt,
      };
    }

    // 3. Initiate single upstream poll
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
  public async checkSettlement(
    portal: GoBizPortalService,
    amountToPay: number,
    force: boolean = false,
  ): Promise<SettlementCheckResult & { fromCache: boolean; nextCheckInSeconds: number }> {
    const { transactions, fromCache, lastPolledAt } = await this.getMutations(portal, force);

    const match = transactions.find(
      (tx) =>
        (tx.status === 'SETTLEMENT' || tx.status === 'CAPTURE') &&
        Math.abs(tx.amount - amountToPay) === 0,
    );

    const nextCheckInSeconds = Math.max(0, Math.round((this.nextAllowedPollAt - Date.now()) / 1000));

    if (match) {
      return {
        paid: true,
        transaction: match,
        amountToPay,
        paidAt: match.settlement_time || match.transaction_time || new Date(lastPolledAt).toISOString(),
        fromCache,
        nextCheckInSeconds,
      };
    }

    return {
      paid: false,
      amountToPay,
      fromCache,
      nextCheckInSeconds,
    };
  }

  /**
   * Get poller state info
   */
  public getStatus() {
    return {
      lastPolledAt: this.lastPolledAt ? new Date(this.lastPolledAt).toISOString() : null,
      nextAllowedPollAt: this.nextAllowedPollAt ? new Date(this.nextAllowedPollAt).toISOString() : null,
      cachedCount: this.cachedTransactions.length,
      isPollingActive: this.activePollPromise !== null,
    };
  }
}
