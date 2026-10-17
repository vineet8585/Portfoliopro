export type MarketAsset = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  sector: string;
  exchange: string;
  color: string;
  description: string;
};

export type Position = {
  symbol: string;
  shares: number;
  averageCost: number;
};

export type OrderSide = "Buy" | "Sell";
export type OrderType = "Market" | "Limit";
export type OrderStatus = "Filled" | "Open" | "Cancelled";

export type PaperOrder = {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  shares: number;
  price: number;
  status: OrderStatus;
  submittedAt: string;
};

export type PricePoint = {
  label: string;
  value: number;
  average: number;
  upper: number;
  lower: number;
  volume: number;
  rsi: number;
  macd: number;
};

export const marketUniverse: MarketAsset[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 138.85,
    change: 3.92,
    changePct: 2.91,
    sector: "Semiconductors",
    exchange: "NASDAQ",
    color: "#91B9FF",
    description:
      "Designs accelerated computing platforms and graphics processing units.",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 226.42,
    change: 1.88,
    changePct: 0.84,
    sector: "Technology",
    exchange: "NASDAQ",
    color: "#DDE3EB",
    description:
      "Designs and sells consumer electronics, software, and digital services.",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 507.34,
    change: 2.31,
    changePct: 0.46,
    sector: "Software",
    exchange: "NASDAQ",
    color: "#81C5FF",
    description:
      "Provides software, cloud services, devices, and productivity tools.",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    price: 222.11,
    change: -1.42,
    changePct: -0.63,
    sector: "Consumer",
    exchange: "NASDAQ",
    color: "#FDBD72",
    description:
      "Operates e-commerce, cloud computing, and digital media businesses.",
  },
  {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    price: 741.65,
    change: 8.21,
    changePct: 1.12,
    sector: "Communication",
    exchange: "NASDAQ",
    color: "#82C8FF",
    description:
      "Builds social platforms and virtual and augmented reality products.",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 189.25,
    change: -0.23,
    changePct: -0.12,
    sector: "Communication",
    exchange: "NASDAQ",
    color: "#F49D8F",
    description:
      "Provides online search, advertising, cloud, and digital products.",
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 343.78,
    change: -8.27,
    changePct: -2.35,
    sector: "Automotive",
    exchange: "NASDAQ",
    color: "#FF8989",
    description:
      "Designs electric vehicles, energy storage, and clean energy products.",
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices, Inc.",
    price: 177.94,
    change: 3.28,
    changePct: 1.88,
    sector: "Semiconductors",
    exchange: "NASDAQ",
    color: "#F4A17D",
    description:
      "Develops high-performance computing and graphics technologies.",
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    price: 286.75,
    change: 1.16,
    changePct: 0.41,
    sector: "Financials",
    exchange: "NYSE",
    color: "#A4D2B9",
    description:
      "A global financial services firm serving consumers and businesses.",
  },
  {
    symbol: "V",
    name: "Visa Inc.",
    price: 354.18,
    change: 2.03,
    changePct: 0.58,
    sector: "Financials",
    exchange: "NYSE",
    color: "#9EB3FF",
    description: "Operates a global electronic payments network.",
  },
  {
    symbol: "LLY",
    name: "Eli Lilly and Company",
    price: 786.24,
    change: 5.74,
    changePct: 0.74,
    sector: "Healthcare",
    exchange: "NYSE",
    color: "#D4A7FF",
    description:
      "Discovers, develops, and markets medicines in several therapeutic areas.",
  },
  {
    symbol: "COST",
    name: "Costco Wholesale Corporation",
    price: 985.3,
    change: -4.63,
    changePct: -0.47,
    sector: "Consumer",
    exchange: "NASDAQ",
    color: "#86C9DB",
    description: "Operates membership warehouses and e-commerce retail.",
  },
];

export const initialWatchlist = ["NVDA", "AAPL", "MSFT", "AMZN", "META"];

export const initialPositions: Position[] = [
  { symbol: "NVDA", shares: 62, averageCost: 129.12 },
  { symbol: "AAPL", shares: 84, averageCost: 213.14 },
  { symbol: "MSFT", shares: 35, averageCost: 468.3 },
  { symbol: "AMZN", shares: 40, averageCost: 213.3 },
  { symbol: "GOOGL", shares: 55, averageCost: 174.25 },
  { symbol: "META", shares: 19, averageCost: 640.1 },
  { symbol: "SPY", shares: 25, averageCost: 602.4 },
];

export const initialOrders: PaperOrder[] = [
  {
    id: "PP-2048",
    symbol: "NVDA",
    side: "Buy",
    type: "Market",
    shares: 12,
    price: 138.85,
    status: "Filled",
    submittedAt: "Today, 10:42 AM",
  },
  {
    id: "PP-2047",
    symbol: "AAPL",
    side: "Sell",
    type: "Limit",
    shares: 8,
    price: 228.0,
    status: "Open",
    submittedAt: "Today, 9:18 AM",
  },
  {
    id: "PP-2046",
    symbol: "MSFT",
    side: "Buy",
    type: "Limit",
    shares: 5,
    price: 505.0,
    status: "Filled",
    submittedAt: "Yesterday, 3:51 PM",
  },
  {
    id: "PP-2045",
    symbol: "META",
    side: "Buy",
    type: "Market",
    shares: 3,
    price: 741.65,
    status: "Filled",
    submittedAt: "Yesterday, 11:24 AM",
  },
  {
    id: "PP-2044",
    symbol: "AMD",
    side: "Sell",
    type: "Limit",
    shares: 10,
    price: 180.0,
    status: "Cancelled",
    submittedAt: "Jun 12, 2:06 PM",
  },
];

export const assetFor = (symbol: string): MarketAsset => {
  const found = marketUniverse.find(asset => asset.symbol === symbol);
  if (found) return found;
  return {
    symbol,
    name:
      symbol === "SPY" ? "SPDR S&P 500 ETF Trust" : `${symbol} Holdings, Inc.`,
    price: symbol === "SPY" ? 614.42 : 100,
    change: 2.74,
    changePct: 0.45,
    sector: symbol === "SPY" ? "ETF · Broad Market" : "Unclassified",
    exchange: "NYSE ARCA",
    color: "#B5C5D0",
    description:
      symbol === "SPY"
        ? "An exchange-traded fund designed to track the S&P 500 Index."
        : "Sample instrument in the PortfolioPro paper-trading workspace.",
  };
};

const hashSymbol = (symbol: string) =>
  Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0);

export function makePriceSeries(
  symbol: string,
  base: number,
  count = 64,
  range = "1D"
): PricePoint[] {
  const seed = hashSymbol(symbol) % 17;
  const periodDays =
    range === "1W"
      ? 7
      : range === "1M"
        ? 30
        : range === "3M"
          ? 90
          : range === "1Y"
            ? 365
            : range === "ALL"
              ? 1825
              : 1;
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const progress = index / Math.max(count - 1, 1);
    const wave =
      (Math.sin(index * 0.39 + seed) * 0.012 +
        Math.cos(index * 0.17 + seed / 2) * 0.008) *
      Math.sin(Math.PI * progress);
    const trend = -0.045 + progress * 0.045;
    const value = base * (1 + trend + wave);
    const average = base * (0.984 + progress * 0.027);
    const spread = base * (0.015 + Math.abs(Math.sin(index * 0.12)) * 0.006);
    const date = new Date(
      now.getTime() - (1 - progress) * periodDays * 86_400_000
    );
    const timeMinutes = 570 + Math.round(progress * 390);
    const label =
      range === "1D"
        ? `${Math.floor(timeMinutes / 60)}:${String(timeMinutes % 60).padStart(2, "0")}`
        : new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(date);
    return {
      label,
      value,
      average,
      upper: average + spread,
      lower: average - spread,
      volume: 20 + Math.round((Math.sin(index * 0.63 + seed) + 1.2) * 42),
      rsi: 48 + Math.sin(index * 0.18 + seed) * 15 + progress * 7,
      macd: Math.sin(index * 0.23 + seed) * 1.7 + progress * 0.4,
    };
  });
}

export function makePortfolioSeries(
  base: number,
  count = 42,
  range = "1D"
): { label: string; value: number }[] {
  const periodDays =
    range === "1W"
      ? 7
      : range === "1M"
        ? 30
        : range === "3M"
          ? 90
          : range === "1Y"
            ? 365
            : range === "ALL"
              ? 1825
              : 1;
  const startRatio =
    range === "1D"
      ? 0.994
      : range === "1W"
        ? 0.978
        : range === "1M"
          ? 0.948
          : range === "3M"
            ? 0.91
            : range === "1Y"
              ? 0.83
              : 0.69;
  const amplitude = range === "1D" ? 0.006 : range === "1W" ? 0.012 : 0.018;
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const progress = index / Math.max(count - 1, 1);
    const wave =
      (Math.sin(index * 0.42) * 0.65 + Math.sin(index * 0.17 + 1.2) * 0.35) *
      amplitude *
      Math.sin(Math.PI * progress);
    const date = new Date(
      now.getTime() - (1 - progress) * periodDays * 86_400_000
    );
    const timeMinutes = 570 + Math.round(progress * 390);
    const label =
      range === "1D"
        ? `${Math.floor(timeMinutes / 60)}:${String(timeMinutes % 60).padStart(2, "0")}`
        : new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(date);
    return {
      label,
      value: base * (startRatio + (1 - startRatio) * progress + wave),
    };
  });
}

export const formatCurrency = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatSignedCurrency = (value: number) =>
  `${value >= 0 ? "+" : "−"}${formatCurrency(Math.abs(value))}`;
export const formatPercent = (value: number, digits = 2) =>
  `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}%`;
export const formatPrice = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
