import type { FundamentalsSnapshot, HistoryResponse, MarketAsset, PaperOrder, PaperPosition } from '../api/market-api.models';

export const DEMO_ASSETS: MarketAsset[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 138.85, change: 3.92, changePct: 2.91, sector: 'Semiconductors', exchange: 'NASDAQ', color: '#91B9FF', description: 'Designs accelerated computing platforms and graphics processing units.' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 226.42, change: 1.88, changePct: 0.84, sector: 'Technology', exchange: 'NASDAQ', color: '#DDE3EB', description: 'Designs and sells consumer electronics, software, and digital services.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 507.34, change: 2.31, changePct: 0.46, sector: 'Software', exchange: 'NASDAQ', color: '#81C5FF', description: 'Provides software, cloud services, devices, and productivity tools.' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 222.11, change: -1.42, changePct: -0.63, sector: 'Consumer', exchange: 'NASDAQ', color: '#FDBD72', description: 'Operates e-commerce, cloud computing, and digital media businesses.' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', price: 741.65, change: 8.21, changePct: 1.12, sector: 'Communication', exchange: 'NASDAQ', color: '#82C8FF', description: 'Builds social platforms and virtual and augmented reality products.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 189.25, change: -0.23, changePct: -0.12, sector: 'Communication', exchange: 'NASDAQ', color: '#F49D8F', description: 'Provides online search, advertising, cloud, and digital products.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 343.78, change: -8.27, changePct: -2.35, sector: 'Automotive', exchange: 'NASDAQ', color: '#FF8989', description: 'Designs electric vehicles, energy storage, and clean energy products.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', price: 177.94, change: 3.28, changePct: 1.88, sector: 'Semiconductors', exchange: 'NASDAQ', color: '#F4A17D', description: 'Develops high-performance computing and graphics technologies.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 286.75, change: 1.16, changePct: 0.41, sector: 'Financials', exchange: 'NYSE', color: '#A4D2B9', description: 'A global financial services firm serving consumers and businesses.' },
  { symbol: 'V', name: 'Visa Inc.', price: 354.18, change: 2.03, changePct: 0.58, sector: 'Financials', exchange: 'NYSE', color: '#9EB3FF', description: 'Operates a global electronic payments network.' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', price: 786.24, change: 5.74, changePct: 0.74, sector: 'Healthcare', exchange: 'NYSE', color: '#D4A7FF', description: 'Discovers, develops, and markets medicines in several therapeutic areas.' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', price: 985.3, change: -4.63, changePct: -0.47, sector: 'Consumer', exchange: 'NASDAQ', color: '#86C9DB', description: 'Operates membership warehouses and e-commerce retail.' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', price: 614.42, change: 2.74, changePct: 0.45, sector: 'ETF · Broad Market', exchange: 'NYSE ARCA', color: '#B5C5D0', description: 'An exchange-traded fund designed to track the S&P 500 Index.' },
];

export const INITIAL_WATCHLIST = ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'META'];

export const INITIAL_POSITIONS: PaperPosition[] = [
  { symbol: 'NVDA', shares: 62, averageCost: 129.12 },
  { symbol: 'AAPL', shares: 84, averageCost: 213.14 },
  { symbol: 'MSFT', shares: 35, averageCost: 468.30 },
  { symbol: 'AMZN', shares: 40, averageCost: 213.30 },
  { symbol: 'GOOGL', shares: 55, averageCost: 174.25 },
  { symbol: 'META', shares: 19, averageCost: 640.10 },
  { symbol: 'SPY', shares: 25, averageCost: 602.40 },
];

const initialTime = Date.now();
export const INITIAL_ORDERS: PaperOrder[] = [
  { id: 'PP-2048', symbol: 'NVDA', side: 'Buy', type: 'Market', shares: 12, price: 138.85, status: 'Filled', submittedAt: new Date(initialTime - 15 * 60_000).toISOString() },
  { id: 'PP-2047', symbol: 'AAPL', side: 'Sell', type: 'Limit', shares: 8, price: 228, status: 'Open', submittedAt: new Date(initialTime - 78 * 60_000).toISOString() },
  { id: 'PP-2046', symbol: 'MSFT', side: 'Buy', type: 'Limit', shares: 5, price: 505, status: 'Filled', submittedAt: new Date(initialTime - 25 * 3_600_000).toISOString() },
  { id: 'PP-2045', symbol: 'META', side: 'Buy', type: 'Market', shares: 3, price: 741.65, status: 'Filled', submittedAt: new Date(initialTime - 28 * 3_600_000).toISOString() },
  { id: 'PP-2044', symbol: 'AMD', side: 'Sell', type: 'Limit', shares: 10, price: 180, status: 'Cancelled', submittedAt: new Date(initialTime - 3 * 86_400_000).toISOString() },
];

export const DEMO_FUNDAMENTALS: Record<string, FundamentalsSnapshot> = {
  NVDA: { symbol: 'NVDA', marketCap: '$3.4T', peRatio: 51.2, revenueGrowthPct: 69.2, grossMarginPct: 74.5, operatingMarginPct: 58.4, dividendYieldPct: 0.03, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  AAPL: { symbol: 'AAPL', marketCap: '$3.4T', peRatio: 32, revenueGrowthPct: 3.4, grossMarginPct: 45.8, operatingMarginPct: 31.8, dividendYieldPct: 0.48, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  MSFT: { symbol: 'MSFT', marketCap: '$3.9T', peRatio: 38.4, revenueGrowthPct: 15.2, grossMarginPct: 69.6, operatingMarginPct: 45, dividendYieldPct: 0.72, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  AMZN: { symbol: 'AMZN', marketCap: '$2.4T', peRatio: 34.7, revenueGrowthPct: 9.6, grossMarginPct: 48, operatingMarginPct: 10.8, dividendYieldPct: 0, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  META: { symbol: 'META', marketCap: '$1.9T', peRatio: 30.6, revenueGrowthPct: 22.1, grossMarginPct: 81, operatingMarginPct: 41, dividendYieldPct: 0.31, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  GOOGL: { symbol: 'GOOGL', marketCap: '$2.3T', peRatio: 21.8, revenueGrowthPct: 13.4, grossMarginPct: 57, operatingMarginPct: 31, dividendYieldPct: 0.48, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  TSLA: { symbol: 'TSLA', marketCap: '$1.1T', peRatio: 78.2, revenueGrowthPct: 4.2, grossMarginPct: 19.8, operatingMarginPct: 7.6, dividendYieldPct: 0, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  AMD: { symbol: 'AMD', marketCap: '$295B', peRatio: 45.2, revenueGrowthPct: 17.3, grossMarginPct: 52, operatingMarginPct: 8.4, dividendYieldPct: 0, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  JPM: { symbol: 'JPM', marketCap: '$820B', peRatio: 12.9, revenueGrowthPct: 5.1, grossMarginPct: null, operatingMarginPct: 37, dividendYieldPct: 2.1, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  V: { symbol: 'V', marketCap: '$706B', peRatio: 32, revenueGrowthPct: 10.2, grossMarginPct: 77, operatingMarginPct: 68, dividendYieldPct: 0.83, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  LLY: { symbol: 'LLY', marketCap: '$746B', peRatio: 35.8, revenueGrowthPct: 16.3, grossMarginPct: 83, operatingMarginPct: 40, dividendYieldPct: 0.6, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  COST: { symbol: 'COST', marketCap: '$436B', peRatio: 58, revenueGrowthPct: 7.1, grossMarginPct: 12.8, operatingMarginPct: 3.9, dividendYieldPct: 0.54, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
  SPY: { symbol: 'SPY', marketCap: 'ETF', peRatio: null, revenueGrowthPct: null, grossMarginPct: null, operatingMarginPct: null, dividendYieldPct: 1.25, snapshotLabel: 'Illustrative sample snapshot — not issuer-reported or current' },
};

export function makeDemoHistory(asset: MarketAsset, requestedRange: string): HistoryResponse {
  const range = (['1D', '1W', '1M', '3M', '1Y', 'ALL'].includes(requestedRange) ? requestedRange : '1D') as HistoryResponse['range'];
  const days: Record<HistoryResponse['range'], number> = { '1D': 0.29, '1W': 7, '1M': 30, '3M': 90, '1Y': 365, ALL: 1825 };
  const count = 72;
  const now = Date.now();
  const seed = Array.from(asset.symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 17;
  const values = Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const wave = (Math.sin(index * 0.39 + seed) * 0.012 + Math.cos(index * 0.17 + seed / 2) * 0.008) * Math.sin(Math.PI * progress);
    return index === count - 1 ? asset.price : asset.price * (1 - 0.045 + progress * 0.045 + wave);
  });
  const points = values.map((value, index) => {
    const progress = index / (count - 1);
    const window = values.slice(Math.max(0, index - 19), index + 1);
    const average = window.reduce((sum, item) => sum + item, 0) / window.length;
    const variance = window.reduce((sum, item) => sum + (item - average) ** 2, 0) / window.length;
    const timestamp = new Date(now - (1 - progress) * days[range] * 86_400_000).toISOString();
    const date = new Date(timestamp);
    const changeWindow = values.slice(Math.max(0, index - 14), index + 1);
    let gains = 0;
    let losses = 0;
    for (let cursor = 1; cursor < changeWindow.length; cursor++) {
      const change = changeWindow[cursor] - changeWindow[cursor - 1];
      if (change > 0) gains += change; else losses -= change;
    }
    const rsi = losses === 0 ? (gains === 0 ? 50 : 100) : 100 - 100 / (1 + gains / losses);
    return {
      label: range === '1D' ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp,
      value,
      average,
      upper: average + 2 * Math.sqrt(variance),
      lower: average - 2 * Math.sqrt(variance),
      volume: 20 + Math.round((Math.sin(index * 0.63 + seed) + 1.2) * 42),
      rsi,
      macd: Math.sin(index * 0.23 + seed) * asset.price * 0.008,
    };
  });
  return { symbol: asset.symbol, range, dataLabel: 'Illustrative synthetic history — not live market data', points };
}
