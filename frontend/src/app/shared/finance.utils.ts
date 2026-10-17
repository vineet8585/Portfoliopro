import type { ChartPoint, ChartRange } from '../core/api/market-api.models';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

export function formatCurrency(value: number): string {
  return usd.format(Number.isFinite(value) ? value : 0);
}

export function formatCompactCurrency(value: number): string {
  return compactUsd.format(Number.isFinite(value) ? value : 0);
}

export function formatSignedCurrency(value: number): string {
  return `${value >= 0 ? '+' : '−'}${formatCurrency(Math.abs(value))}`;
}

export function formatPercent(value: number, digits = 2): string {
  return `${value >= 0 ? '+' : '−'}${Math.abs(Number.isFinite(value) ? value : 0).toFixed(digits)}%`;
}

export function formatPrice(value: number): string {
  return formatCurrency(value);
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

export function makePortfolioHistory(totalValue: number, range: ChartRange): ChartPoint[] {
  const periodDays: Record<ChartRange, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365, ALL: 1825 };
  const startRatio: Record<ChartRange, number> = { '1D': 0.994, '1W': 0.978, '1M': 0.948, '3M': 0.91, '1Y': 0.83, ALL: 0.69 };
  const now = Date.now();
  return Array.from({ length: 42 }, (_, index) => {
    const progress = index / 41;
    const amplitude = range === '1D' ? 0.006 : range === '1W' ? 0.012 : 0.018;
    const wave = (Math.sin(index * 0.42) * 0.65 + Math.sin(index * 0.17 + 1.2) * 0.35) * amplitude * Math.sin(Math.PI * progress);
    const value = index === 41 ? totalValue : totalValue * (startRatio[range] + (1 - startRatio[range]) * progress + wave);
    const date = new Date(now - (1 - progress) * periodDays[range] * 86_400_000);
    const label = range === '1D'
      ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label, value };
  });
}
