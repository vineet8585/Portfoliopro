export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  sector: string;
  exchange: string;
  color: string;
  description: string;
}

export interface PricePoint {
  label: string;
  timestamp: string;
  value: number;
  average: number;
  upper: number;
  lower: number;
  volume: number;
  rsi: number;
  macd: number;
}

export interface HistoryResponse {
  symbol: string;
  range: ChartRange;
  dataLabel: string;
  points: PricePoint[];
}

export interface FundamentalsSnapshot {
  symbol: string;
  marketCap: string;
  peRatio: number | null;
  revenueGrowthPct: number | null;
  grossMarginPct: number | null;
  operatingMarginPct: number | null;
  dividendYieldPct: number | null;
  snapshotLabel: string;
}

export type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
export type OrderSide = 'Buy' | 'Sell';
export type OrderType = 'Market' | 'Limit';
export type OrderStatus = 'Filled' | 'Open' | 'Cancelled';

export interface PaperPosition {
  symbol: string;
  shares: number;
  averageCost: number;
}

export interface PaperOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  shares: number;
  price: number;
  status: OrderStatus;
  submittedAt: string;
}

export interface ChartPoint {
  label: string;
  value: number;
  average?: number;
  upper?: number;
  lower?: number;
  volume?: number;
  rsi?: number;
  macd?: number;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid ${field} in market API response.`);
  }
  return value;
}

function numeric(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid ${field} in market API response.`);
  }
  return value;
}

function optionalNumeric(value: unknown, field: string): number | null {
  return value === null ? null : numeric(value, field);
}

export function parseMarketAssets(value: unknown): MarketAsset[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('The market API returned no sample assets.');
  }
  return value.map((item, index) => {
    const source = record(item, `Asset ${index + 1}`);
    const color = text(source['color'], 'color');
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      throw new Error(`Invalid asset color in market API response.`);
    }
    return {
      symbol: text(source['symbol'], 'symbol'),
      name: text(source['name'], 'name'),
      price: numeric(source['price'], 'price'),
      change: numeric(source['change'], 'change'),
      changePct: numeric(source['changePct'], 'changePct'),
      sector: text(source['sector'], 'sector'),
      exchange: text(source['exchange'], 'exchange'),
      color,
      description: text(source['description'], 'description'),
    };
  });
}

export function parseHistory(value: unknown): HistoryResponse {
  const source = record(value, 'History response');
  const range = text(source['range'], 'range') as ChartRange;
  const allowed: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  if (!allowed.includes(range)) throw new Error('Invalid range in history response.');
  if (!Array.isArray(source['points']) || source['points'].length < 2) {
    throw new Error('The market API returned insufficient history.');
  }
  const points = source['points'].map((item, index): PricePoint => {
    const point = record(item, `History point ${index + 1}`);
    const timestamp = text(point['timestamp'], 'timestamp');
    if (!Number.isFinite(Date.parse(timestamp))) {
      throw new Error('Invalid timestamp in history response.');
    }
    return {
      label: text(point['label'], 'label'),
      timestamp,
      value: numeric(point['value'], 'value'),
      average: numeric(point['average'], 'average'),
      upper: numeric(point['upper'], 'upper'),
      lower: numeric(point['lower'], 'lower'),
      volume: numeric(point['volume'], 'volume'),
      rsi: numeric(point['rsi'], 'rsi'),
      macd: numeric(point['macd'], 'macd'),
    };
  });
  return {
    symbol: text(source['symbol'], 'symbol'),
    range,
    dataLabel: text(source['dataLabel'], 'dataLabel'),
    points,
  };
}

export function parseFundamentals(value: unknown): FundamentalsSnapshot {
  const source = record(value, 'Fundamentals response');
  return {
    symbol: text(source['symbol'], 'symbol'),
    marketCap: text(source['marketCap'], 'marketCap'),
    peRatio: optionalNumeric(source['peRatio'], 'peRatio'),
    revenueGrowthPct: optionalNumeric(source['revenueGrowthPct'], 'revenueGrowthPct'),
    grossMarginPct: optionalNumeric(source['grossMarginPct'], 'grossMarginPct'),
    operatingMarginPct: optionalNumeric(source['operatingMarginPct'], 'operatingMarginPct'),
    dividendYieldPct: optionalNumeric(source['dividendYieldPct'], 'dividendYieldPct'),
    snapshotLabel: text(source['snapshotLabel'], 'snapshotLabel'),
  };
}
