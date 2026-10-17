import { computed, Injectable, signal } from '@angular/core';
import type { MarketAsset, OrderSide, OrderStatus, OrderType, PaperOrder, PaperPosition } from '../api/market-api.models';
import { INITIAL_ORDERS, INITIAL_POSITIONS, INITIAL_WATCHLIST } from '../data/demo-market';
import { MarketDataStore } from './market-data.store';

export interface PaperAccountState {
  version: 1;
  cash: number;
  positions: PaperPosition[];
  orders: PaperOrder[];
  watchlist: string[];
}

export interface OrderDraft {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  shares: number;
  limitPrice?: number;
}

export interface OrderResult {
  ok: boolean;
  message: string;
  order?: PaperOrder;
}

export interface PositionSummary extends PaperPosition {
  asset: MarketAsset;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  dayChange: number;
}

const STORAGE_KEY = 'portfoliopro.paper-account.v1';
const DEFAULT_STATE: PaperAccountState = {
  version: 1,
  cash: 42_584.23,
  positions: INITIAL_POSITIONS,
  orders: INITIAL_ORDERS,
  watchlist: INITIAL_WATCHLIST,
};

@Injectable({ providedIn: 'root' })
export class PaperPortfolioStore {
  readonly account = signal<PaperAccountState>(this.restore());
  readonly ticketOpen = signal(false);
  readonly ticketSymbol = signal('NVDA');
  readonly ticketSide = signal<OrderSide>('Buy');
  readonly persistenceWarning = signal<string | null>(null);

  readonly cash = computed(() => this.account().cash);
  readonly positions = computed(() => this.account().positions);
  readonly orders = computed(() => this.account().orders);
  readonly watchlist = computed(() => this.account().watchlist);
  readonly positionsSummary = computed<PositionSummary[]>(() => this.positions().map((position) => {
    const asset = this.market.asset(position.symbol);
    const marketValue = position.shares * asset.price;
    const costBasis = position.shares * position.averageCost;
    return {
      ...position,
      asset,
      marketValue,
      costBasis,
      unrealizedPnl: marketValue - costBasis,
      dayChange: position.shares * asset.change,
    };
  }));
  readonly marketValue = computed(() => this.positionsSummary().reduce((sum, position) => sum + position.marketValue, 0));
  readonly totalValue = computed(() => this.cash() + this.marketValue());
  readonly dayChange = computed(() => this.positionsSummary().reduce((sum, position) => sum + position.dayChange, 0));
  readonly dayChangePct = computed(() => {
    const previousValue = this.totalValue() - this.dayChange();
    return previousValue > 0 ? (this.dayChange() / previousValue) * 100 : 0;
  });
  readonly costBasis = computed(() => this.positionsSummary().reduce((sum, position) => sum + position.costBasis, 0));
  readonly unrealizedPnl = computed(() => this.marketValue() - this.costBasis());
  readonly buyingPower = computed(() => Math.max(0, this.cash() - this.openBuyReserve()));
  readonly allocationBySector = computed(() => {
    const values = new Map<string, number>();
    for (const position of this.positionsSummary()) {
      values.set(position.asset.sector, (values.get(position.asset.sector) ?? 0) + position.marketValue);
    }
    return [...values.entries()]
      .map(([sector, value]) => ({ sector, value, weightPct: this.marketValue() > 0 ? value / this.marketValue() * 100 : 0 }))
      .sort((left, right) => right.value - left.value);
  });

  constructor(private readonly market: MarketDataStore) {}

  openTicket(symbol = 'NVDA', side: OrderSide = 'Buy'): void {
    this.ticketSymbol.set(symbol.toUpperCase());
    this.ticketSide.set(side);
    this.ticketOpen.set(true);
  }

  closeTicket(): void {
    this.ticketOpen.set(false);
  }

  toggleWatchlist(symbol: string): void {
    const normalized = symbol.toUpperCase();
    const current = this.account();
    const watchlist = current.watchlist.includes(normalized)
      ? current.watchlist.filter((item) => item !== normalized)
      : [...current.watchlist, normalized];
    this.commit({ ...current, watchlist });
  }

  hasWatchlistSymbol(symbol: string): boolean {
    return this.watchlist().includes(symbol.toUpperCase());
  }

  availableShares(symbol: string): number {
    const held = this.positions().find((item) => item.symbol === symbol.toUpperCase())?.shares ?? 0;
    const reserved = this.orders()
      .filter((order) => order.status === 'Open' && order.side === 'Sell' && order.symbol === symbol.toUpperCase())
      .reduce((sum, order) => sum + order.shares, 0);
    return Math.max(0, held - reserved);
  }

  submitOrder(draft: OrderDraft): OrderResult {
    const symbol = draft.symbol.toUpperCase();
    const asset = this.market.asset(symbol);
    if (!Number.isInteger(draft.shares) || draft.shares <= 0) {
      return { ok: false, message: 'Enter a whole-share quantity greater than zero.' };
    }
    if (draft.type === 'Limit' && (!Number.isFinite(draft.limitPrice) || (draft.limitPrice ?? 0) <= 0)) {
      return { ok: false, message: 'Enter a valid limit price.' };
    }
    if (draft.side === 'Sell' && draft.shares > this.availableShares(symbol)) {
      return { ok: false, message: 'Not enough unreserved shares in this paper portfolio.' };
    }

    const limitPrice = draft.type === 'Limit' ? (draft.limitPrice as number) : asset.price;
    const marketable = draft.type === 'Market'
      || (draft.side === 'Buy' ? limitPrice >= asset.price : limitPrice <= asset.price);
    const executionPrice = marketable ? asset.price : limitPrice;
    const notional = executionPrice * draft.shares;
    if (draft.side === 'Buy' && marketable && notional > this.cash() + 0.000001) {
      return { ok: false, message: 'Not enough demo cash for this simulated order.' };
    }
    if (draft.side === 'Buy' && !marketable && notional > this.buyingPower() + 0.000001) {
      return { ok: false, message: 'Not enough demo buying power to reserve this limit order.' };
    }

    const order: PaperOrder = {
      id: `PP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      symbol,
      side: draft.side,
      type: draft.type,
      shares: draft.shares,
      price: executionPrice,
      status: marketable ? 'Filled' : 'Open',
      submittedAt: new Date().toISOString(),
    };
    let next: PaperAccountState = { ...this.account(), orders: [order, ...this.orders()] };

    if (marketable && draft.side === 'Buy') {
      const existing = this.positions().find((position) => position.symbol === symbol);
      const positions = existing
        ? this.positions().map((position) => position.symbol === symbol
            ? {
                ...position,
                averageCost: (position.shares * position.averageCost + notional) / (position.shares + draft.shares),
                shares: position.shares + draft.shares,
              }
            : position)
        : [...this.positions(), { symbol, shares: draft.shares, averageCost: executionPrice }];
      next = { ...next, cash: this.cash() - notional, positions };
    } else if (marketable && draft.side === 'Sell') {
      const positions = this.positions()
        .map((position) => position.symbol === symbol ? { ...position, shares: position.shares - draft.shares } : position)
        .filter((position) => position.shares > 0);
      next = { ...next, cash: this.cash() + notional, positions };
    }

    this.commit(next);
    return {
      ok: true,
      message: marketable
        ? `Paper order filled at the illustrative ${asset.exchange} quote.`
        : 'Limit order added to the simulated open-order list; demo cash or shares are reserved locally.',
      order,
    };
  }

  cancelOrder(id: string): void {
    const orders = this.orders().map((order) => order.id === id && order.status === 'Open'
      ? { ...order, status: 'Cancelled' as OrderStatus }
      : order);
    this.commit({ ...this.account(), orders });
  }

  private openBuyReserve(): number {
    return this.orders()
      .filter((order) => order.status === 'Open' && order.side === 'Buy')
      .reduce((sum, order) => sum + order.price * order.shares, 0);
  }

  private commit(next: PaperAccountState): void {
    this.account.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.persistenceWarning.set(null);
    } catch {
      this.persistenceWarning.set('Browser storage is unavailable; this paper session may reset when the page closes.');
    }
  }

  private restore(): PaperAccountState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const value: unknown = JSON.parse(raw);
      if (typeof value !== 'object' || value === null) return structuredClone(DEFAULT_STATE);
      const candidate = value as Partial<PaperAccountState>;
      const validCash = typeof candidate.cash === 'number' && Number.isFinite(candidate.cash) && candidate.cash >= 0;
      const validPositions = Array.isArray(candidate.positions) && candidate.positions.every((item) =>
        typeof item?.symbol === 'string' && Number.isInteger(item.shares) && item.shares > 0
        && Number.isFinite(item.averageCost) && item.averageCost > 0);
      const validOrders = Array.isArray(candidate.orders) && candidate.orders.every((item) =>
        typeof item?.id === 'string' && typeof item.symbol === 'string'
        && ['Buy', 'Sell'].includes(item.side) && ['Market', 'Limit'].includes(item.type)
        && ['Filled', 'Open', 'Cancelled'].includes(item.status)
        && Number.isInteger(item.shares) && item.shares > 0 && Number.isFinite(item.price));
      const validWatchlist = Array.isArray(candidate.watchlist) && candidate.watchlist.every((item) => typeof item === 'string');
      if (!validCash || !validPositions || !validOrders || !validWatchlist) return structuredClone(DEFAULT_STATE);
      return {
        version: 1,
        cash: candidate.cash as number,
        positions: (candidate.positions as PaperPosition[]).filter((item) => this.market.asset(item.symbol).symbol === item.symbol.toUpperCase()),
        orders: candidate.orders as PaperOrder[],
        watchlist: [...new Set((candidate.watchlist as string[]).map((item) => item.toUpperCase()))],
      };
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }
}
