import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Download,
  FileText,
  LayoutDashboard,
  ListFilter,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
const PortfolioChart = lazy(() =>
  import("@/features/portfolio/Charts").then(module => ({
    default: module.PortfolioChart,
  }))
);
const AssetChart = lazy(() =>
  import("@/features/portfolio/Charts").then(module => ({
    default: module.AssetChart,
  }))
);
const IndicatorChart = lazy(() =>
  import("@/features/portfolio/Charts").then(module => ({
    default: module.IndicatorChart,
  }))
);
const AllocationChart = lazy(() =>
  import("@/features/portfolio/Charts").then(module => ({
    default: module.AllocationChart,
  }))
);
import OrderDialog from "@/features/portfolio/OrderDialog";
import { usePaperPortfolio } from "@/features/portfolio/usePaperPortfolio";
import {
  assetFor,
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  formatPrice,
  formatSignedCurrency,
  initialWatchlist,
  marketUniverse,
  type MarketAsset,
  type PaperOrder,
  type Position,
} from "@/features/portfolio/types";
import "./Home.css";

type ViewKey =
  | "Overview"
  | "Portfolio"
  | "Markets"
  | "Analysis"
  | "Risk"
  | "Orders";
const navItems: {
  label: ViewKey;
  icon: typeof LayoutDashboard;
  group: "workspace" | "manage";
}[] = [
  { label: "Overview", icon: LayoutDashboard, group: "workspace" },
  { label: "Portfolio", icon: BriefcaseBusiness, group: "workspace" },
  { label: "Markets", icon: ChartNoAxesCombined, group: "workspace" },
  { label: "Analysis", icon: Activity, group: "workspace" },
  { label: "Risk", icon: ShieldAlert, group: "manage" },
  { label: "Orders", icon: ListFilter, group: "manage" },
];
const ranges = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

function MiniSparkline({
  seed,
  positive = true,
}: {
  seed: number;
  positive?: boolean;
}) {
  const points = Array.from({ length: 16 }, (_, index) => {
    const wave =
      Math.sin(index * 0.77 + seed) * 4 + Math.cos(index * 0.31 + seed) * 2;
    return `${index * 5.1},${positive ? 21 - index * 0.8 + wave : 6 + index * 0.8 + wave}`;
  });
  return (
    <svg className="mini-sparkline" viewBox="0 0 78 28" aria-hidden="true">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={positive ? "#75e2b5" : "#ff8e9a"}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function downloadPortfolioCsv(positions: Position[]) {
  const rows = [
    [
      "Symbol",
      "Company",
      "Shares",
      "Average cost",
      "Sample quote",
      "Market value",
      "Unrealized P&L",
    ],
    ...positions.map(position => {
      const asset = assetFor(position.symbol);
      const marketValue = position.shares * asset.price;
      const pnl = (asset.price - position.averageCost) * position.shares;
      return [
        asset.symbol,
        asset.name,
        position.shares,
        position.averageCost.toFixed(2),
        asset.price.toFixed(2),
        marketValue.toFixed(2),
        pnl.toFixed(2),
      ];
    }),
  ];
  const csv = rows
    .map(row =>
      row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `portfoliopro-paper-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AssetMark({
  asset,
  size = "md",
}: {
  asset: MarketAsset;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={`asset-mark asset-mark-${size}`}
      style={{ "--asset-color": asset.color } as React.CSSProperties}
    >
      {asset.symbol.slice(0, 1)}
    </span>
  );
}

function DemoTag({ small = false }: { small?: boolean }) {
  return (
    <span className={`demo-pill ${small ? "demo-pill-small" : ""}`}>
      <span className="demo-dot" />
      DEMO DATA
    </span>
  );
}

function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">INVESTOR WORKSPACE</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  seed,
  note,
}: {
  label: string;
  value: string;
  change?: string;
  changeLabel?: string;
  icon: typeof Wallet;
  seed: number;
  note?: string;
}) {
  const negative = !!change && change.startsWith("−");
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={16} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-bottom">
        {change ? (
          <span className={`stat-change ${negative ? "negative" : "positive"}`}>
            {negative ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
            {change}
            <span>{changeLabel}</span>
          </span>
        ) : (
          <span className="stat-note">{note}</span>
        )}
        <MiniSparkline seed={seed} positive={!negative} />
      </div>
    </article>
  );
}

function PanelTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="panel-action">{action}</div>}
    </div>
  );
}

function RangeSwitch({
  value,
  onChange,
}: {
  value: string;
  onChange: (range: string) => void;
}) {
  return (
    <div className="range-switch" role="group" aria-label="Chart timeframe">
      {ranges.map(range => (
        <button
          key={range}
          className={value === range ? "active" : ""}
          type="button"
          onClick={() => onChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

function Change({
  value,
  percent,
  compact = false,
}: {
  value: number;
  percent: number;
  compact?: boolean;
}) {
  const positive = value >= 0;
  return (
    <span className={`change-stack ${positive ? "positive" : "negative"}`}>
      {positive ? (
        <ArrowUpRight size={compact ? 13 : 14} />
      ) : (
        <ArrowDownRight size={compact ? 13 : 14} />
      )}
      <span>
        {compact
          ? formatPercent(percent)
          : `${formatSignedCurrency(value)} (${formatPercent(percent)})`}
      </span>
    </span>
  );
}

function AssetTable({
  assets,
  watchlist,
  onToggleWatch,
  onSelect,
  onTrade,
  compact = false,
}: {
  assets: MarketAsset[];
  watchlist: string[];
  onToggleWatch: (symbol: string) => void;
  onSelect: (symbol: string) => void;
  onTrade: (symbol: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Last price</th>
            <th>Change</th>
            {!compact && <th>Trend</th>}
            <th className="align-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => (
            <tr key={asset.symbol}>
              <td>
                <button
                  className="instrument-cell"
                  type="button"
                  onClick={() => onSelect(asset.symbol)}
                >
                  <AssetMark asset={asset} size="sm" />
                  <span className="instrument-copy">
                    <strong>{asset.symbol}</strong>
                    <small>{asset.name}</small>
                  </span>
                </button>
              </td>
              <td className="numeric">{formatPrice(asset.price)}</td>
              <td>
                <Change
                  value={asset.change}
                  percent={asset.changePct}
                  compact
                />
              </td>
              {!compact && (
                <td>
                  <MiniSparkline
                    seed={asset.symbol.length * asset.price}
                    positive={asset.change >= 0}
                  />
                </td>
              )}
              <td className="align-right table-actions">
                <button
                  className="icon-button watch-button"
                  type="button"
                  aria-label={`${watchlist.includes(asset.symbol) ? "Remove" : "Add"} ${asset.symbol} ${watchlist.includes(asset.symbol) ? "from" : "to"} watchlist`}
                  onClick={() => onToggleWatch(asset.symbol)}
                >
                  <Star
                    size={15}
                    fill={watchlist.includes(asset.symbol) ? "#f3be72" : "none"}
                    color={
                      watchlist.includes(asset.symbol)
                        ? "#f3be72"
                        : "currentColor"
                    }
                  />
                </button>
                <button
                  className="small-outline-button"
                  type="button"
                  onClick={() => onTrade(asset.symbol)}
                >
                  Trade
                </button>
              </td>
            </tr>
          ))}
          {assets.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-cell">
                No sample symbols match that search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PositionTable({
  positions,
  onSelect,
  onTrade,
  compact = false,
}: {
  positions: Position[];
  onSelect: (symbol: string) => void;
  onTrade: (symbol: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Holding</th>
            <th>Shares</th>
            <th>Avg. cost</th>
            <th>Market value</th>
            <th>Unrealized P&amp;L</th>
            {!compact && <th />}
          </tr>
        </thead>
        <tbody>
          {positions.map(position => {
            const asset = assetFor(position.symbol);
            const value = position.shares * asset.price;
            const pnl = (asset.price - position.averageCost) * position.shares;
            const pct =
              ((asset.price - position.averageCost) / position.averageCost) *
              100;
            return (
              <tr key={position.symbol}>
                <td>
                  <button
                    className="instrument-cell"
                    type="button"
                    onClick={() => onSelect(position.symbol)}
                  >
                    <AssetMark asset={asset} size="sm" />
                    <span className="instrument-copy">
                      <strong>{position.symbol}</strong>
                      <small>{asset.name}</small>
                    </span>
                  </button>
                </td>
                <td className="numeric">{position.shares.toLocaleString()}</td>
                <td className="numeric">{formatPrice(position.averageCost)}</td>
                <td className="numeric">{formatCurrency(value)}</td>
                <td>
                  <div
                    className={`pnl-cell ${pnl >= 0 ? "positive" : "negative"}`}
                  >
                    <strong>{formatSignedCurrency(pnl)}</strong>
                    <small>{formatPercent(pct)}</small>
                  </div>
                </td>
                {!compact && (
                  <td className="align-right">
                    <button
                      className="small-outline-button"
                      type="button"
                      onClick={() => onTrade(position.symbol)}
                    >
                      Trade
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
          {positions.length === 0 && (
            <tr>
              <td colSpan={6} className="empty-cell">
                No paper holdings yet. Place a simulated buy order to add a
                position.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function OrderTable({
  orders,
  onCancel,
  compact = false,
}: {
  orders: PaperOrder[];
  onCancel: (id: string) => void;
  compact?: boolean;
}) {
  const shown = compact ? orders.slice(0, 4) : orders;
  return (
    <div className="table-scroll">
      <table className="data-table order-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Side</th>
            <th>Type</th>
            <th>Shares</th>
            <th>Price</th>
            <th>Status</th>
            {!compact && <th>Submitted</th>}
            {!compact && <th />}
          </tr>
        </thead>
        <tbody>
          {shown.map(order => (
            <tr key={`${order.id}-${order.submittedAt}`}>
              <td>
                <div className="order-id">
                  <strong>{order.symbol}</strong>
                  <small>{order.id}</small>
                </div>
              </td>
              <td>
                <span className={`side-label ${order.side.toLowerCase()}`}>
                  {order.side}
                </span>
              </td>
              <td>{order.type}</td>
              <td className="numeric">{order.shares}</td>
              <td className="numeric">{formatPrice(order.price)}</td>
              <td>
                <span
                  className={`status-pill status-${order.status.toLowerCase()}`}
                >
                  <span />
                  {order.status === "Open"
                    ? "Open"
                    : order.status === "Filled"
                      ? "Filled"
                      : "Cancelled"}
                </span>
              </td>
              {!compact && <td className="muted-cell">{order.submittedAt}</td>}
              {!compact && (
                <td className="align-right">
                  {order.status === "Open" && (
                    <button
                      className="text-button danger-text"
                      type="button"
                      onClick={() => onCancel(order.id)}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverviewView({
  totalValue,
  marketValue,
  cash,
  dayChange,
  positions,
  orders,
  watchlist,
  onToggleWatch,
  onSelect,
  onTrade,
  onNavigate,
  onCancel,
}: any) {
  const rangeState = useState("1D");
  const range = rangeState[0] as string;
  const setRange = rangeState[1] as (range: string) => void;
  const todayPercent = totalValue
    ? (dayChange / Math.max(totalValue - dayChange, 1)) * 100
    : 0;
  const investedTotal = positions.reduce(
    (sum: number, position: Position) =>
      sum + position.shares * assetFor(position.symbol).price,
    0
  );
  const concentrationScore = Math.min(
    100,
    Math.round(
      positions.reduce((sum: number, position: Position) => {
        const share =
          (position.shares * assetFor(position.symbol).price) /
          Math.max(investedTotal, 1);
        return sum + share * share;
      }, 0) * 100
    )
  );
  const allocation = [
    ...positions.map((position: Position) => ({
      name: position.symbol,
      value: position.shares * assetFor(position.symbol).price,
    })),
    { name: "Cash", value: cash },
  ];
  const watched = marketUniverse
    .filter(asset => watchlist.includes(asset.symbol))
    .slice(0, 5);
  const movers = [...marketUniverse]
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 4);
  return (
    <>
      <PageHeading
        title="Portfolio overview"
        subtitle="A clear view of your positions, performance, and the markets you follow."
        action={
          <button
            className="primary-button"
            type="button"
            onClick={() => onTrade("NVDA")}
          >
            <Plus size={16} />
            New paper trade
          </button>
        }
      />
      <div className="overview-stats">
        <StatCard
          label="Total account value"
          value={formatCurrency(totalValue)}
          change={formatSignedCurrency(dayChange)}
          changeLabel="today"
          icon={Wallet}
          seed={2}
        />
        <StatCard
          label="Invested"
          value={formatCurrency(marketValue)}
          change={`${((marketValue / Math.max(totalValue, 1)) * 100).toFixed(1)}%`}
          changeLabel="of account"
          icon={BriefcaseBusiness}
          seed={4}
        />
        <StatCard
          label="Available cash"
          value={formatCurrency(cash)}
          note="Paper account buying power"
          icon={Command}
          seed={6}
        />
        <StatCard
          label="Today's return"
          value={formatPercent(todayPercent)}
          change={formatSignedCurrency(dayChange)}
          changeLabel="sample move"
          icon={Activity}
          seed={7}
        />
      </div>
      <div className="overview-grid overview-grid-top">
        <section className="panel performance-panel">
          <PanelTitle
            title="Portfolio performance"
            subtitle="Illustrative account value over time"
            action={<RangeSwitch value={range} onChange={setRange} />}
          />
          <div className="performance-summary">
            <strong>{formatCurrency(totalValue)}</strong>
            <span
              className={`performance-change ${dayChange >= 0 ? "positive" : "negative"}`}
            >
              {formatSignedCurrency(dayChange)}{" "}
              <small>({formatPercent(todayPercent)}) today</small>
            </span>
          </div>
          <Suspense
            fallback={
              <div
                className="portfolio-chart chart-loading"
                aria-label="Loading portfolio chart"
              />
            }
          >
            <PortfolioChart value={totalValue} range={range} />
          </Suspense>
          <div className="chart-footnote">
            <span>
              <i className="legend-dot mint" />
              Portfolio value
            </span>
            <span>Sample history · Not market data</span>
          </div>
        </section>
        <section className="panel allocation-panel">
          <PanelTitle
            title="Asset allocation"
            subtitle="Current paper portfolio"
            action={
              <button
                className="icon-button"
                type="button"
                aria-label="Allocation options"
                onClick={() =>
                  toast.info(
                    "Allocation reflects current paper holdings and cash."
                  )
                }
              >
                <MoreHorizontal size={18} />
              </button>
            }
          />
          <div className="allocation-content">
            <div className="allocation-donut">
              <Suspense
                fallback={
                  <div
                    className="allocation-chart allocation-chart-compact chart-loading"
                    aria-label="Loading allocation chart"
                  />
                }
              >
                <AllocationChart positions={allocation} compact />
              </Suspense>
              <div className="donut-center">
                <strong>{formatCompactCurrency(totalValue)}</strong>
                <span>Total value</span>
              </div>
            </div>
            <div className="allocation-legend">
              {allocation
                .slice(0, 5)
                .map((item: { name: string; value: number }, index: number) => (
                  <div className="legend-row" key={item.name}>
                    <span className={`legend-dot allocation-${index}`} />
                    {item.name}
                    <strong>
                      {((item.value / Math.max(totalValue, 1)) * 100).toFixed(
                        1
                      )}
                      %
                    </strong>
                  </div>
                ))}
            </div>
          </div>
          <button
            className="panel-link"
            type="button"
            onClick={() => onNavigate("Portfolio")}
          >
            View portfolio breakdown <ChevronRight size={15} />
          </button>
        </section>
      </div>
      <div className="overview-grid overview-grid-middle">
        <section className="panel watchlist-panel">
          <PanelTitle
            title="Your watchlist"
            subtitle="Sample quotes · Favorites you follow"
            action={
              <button
                className="panel-link"
                type="button"
                onClick={() => onNavigate("Markets")}
              >
                All markets <ChevronRight size={15} />
              </button>
            }
          />
          <AssetTable
            assets={watched}
            watchlist={watchlist}
            onToggleWatch={onToggleWatch}
            onSelect={onSelect}
            onTrade={onTrade}
            compact
          />
          <button
            className="add-watchlist"
            type="button"
            onClick={() => onNavigate("Markets")}
          >
            <Plus size={14} />
            Manage watchlist
          </button>
        </section>
        <section className="panel movers-panel">
          <PanelTitle
            title="Market movers"
            subtitle="Illustrative daily change"
            action={<span className="demo-mini">SAMPLE</span>}
          />
          <div className="mover-list">
            {movers.map((asset, index) => (
              <button
                className="mover-row"
                type="button"
                key={asset.symbol}
                onClick={() => onSelect(asset.symbol)}
              >
                <span className="mover-rank">0{index + 1}</span>
                <AssetMark asset={asset} size="sm" />
                <span className="instrument-copy">
                  <strong>{asset.symbol}</strong>
                  <small>{asset.name.split(" ")[0]}</small>
                </span>
                <MiniSparkline
                  seed={asset.price}
                  positive={asset.change >= 0}
                />
                <span
                  className={`mover-percent ${asset.change >= 0 ? "positive" : "negative"}`}
                >
                  {formatPercent(asset.changePct)}
                </span>
              </button>
            ))}
          </div>
          <div className="movers-note">
            <Clock3 size={13} />
            Sample snapshot · Refresh when a data provider is connected
          </div>
        </section>
      </div>
      <div className="overview-grid overview-grid-bottom">
        <section className="panel holdings-panel">
          <PanelTitle
            title="Top holdings"
            subtitle={`${positions.length} positions in your paper portfolio`}
            action={
              <button
                className="panel-link"
                type="button"
                onClick={() => onNavigate("Portfolio")}
              >
                Full portfolio <ChevronRight size={15} />
              </button>
            }
          />
          <PositionTable
            positions={positions.slice(0, 5)}
            onSelect={onSelect}
            onTrade={onTrade}
            compact
          />
        </section>
        <section className="panel risk-summary-panel">
          <PanelTitle
            title="Risk snapshot"
            subtitle="Portfolio-level exposure"
            action={
              <button
                className="panel-link"
                type="button"
                onClick={() => onNavigate("Risk")}
              >
                Details <ChevronRight size={15} />
              </button>
            }
          />
          <div className="risk-meter-row">
            <div
              className="risk-ring"
              style={{
                background: `radial-gradient(circle at center, #111b25 57%, transparent 59%), conic-gradient(${concentrationScore > 42 ? "#f3be72" : "#75e2b5"} 0 ${concentrationScore}%, #28333c ${concentrationScore}% 100%)`,
              }}
            >
              <strong>{concentrationScore}</strong>
              <span>/100</span>
            </div>
            <div>
              <div className="risk-label">
                {concentrationScore > 42
                  ? "Moderate concentration"
                  : "Broadly allocated"}
              </div>
              <p>Largest holding: {positions[0]?.symbol ?? "—"}</p>
              <span className="risk-tag">
                <ShieldAlert size={12} />
                {concentrationScore > 42
                  ? "Concentration to review"
                  : "Concentration index"}
              </span>
            </div>
          </div>
          <div className="risk-bar-label">
            <span>Single-position exposure</span>
            <strong>
              {positions.length
                ? `${((Math.max(...positions.map((position: Position) => position.shares * assetFor(position.symbol).price)) / Math.max(marketValue, 1)) * 100).toFixed(0)}%`
                : "0%"}
            </strong>
          </div>
          <div className="risk-track">
            <span
              style={{
                width: `${positions.length ? Math.min(88, (Math.max(...positions.map((position: Position) => position.shares * assetFor(position.symbol).price)) / Math.max(marketValue, 1)) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="risk-disclaimer">
            Illustrative risk indicators only; not investment advice.
          </p>
        </section>
      </div>
      <section className="panel recent-orders-panel">
        <PanelTitle
          title="Recent paper orders"
          subtitle="Sample activity and simulated orders"
          action={
            <button
              className="panel-link"
              type="button"
              onClick={() => onNavigate("Orders")}
            >
              Order history <ChevronRight size={15} />
            </button>
          }
        />
        <OrderTable orders={orders} onCancel={onCancel} compact />
      </section>
    </>
  );
}

function PortfolioView({
  totalValue,
  marketValue,
  cash,
  dayChange,
  positions,
  onSelect,
  onTrade,
  onExport,
}: any) {
  const gain = positions.reduce(
    (sum: number, position: Position) =>
      sum +
      (assetFor(position.symbol).price - position.averageCost) *
        position.shares,
    0
  );
  const allocation = [
    ...positions.map((position: Position) => ({
      name: position.symbol,
      value: position.shares * assetFor(position.symbol).price,
    })),
    { name: "Cash", value: cash },
  ];
  return (
    <>
      <PageHeading
        title="Portfolio"
        subtitle="Track holdings, available cash, and position-level performance."
        action={
          <button
            className="primary-button"
            type="button"
            onClick={() => onTrade("AAPL")}
          >
            <Plus size={16} />
            New paper trade
          </button>
        }
      />
      <div className="overview-stats portfolio-stats">
        <StatCard
          label="Account value"
          value={formatCurrency(totalValue)}
          change={formatSignedCurrency(dayChange)}
          changeLabel="today"
          icon={Wallet}
          seed={2}
        />
        <StatCard
          label="Invested value"
          value={formatCurrency(marketValue)}
          note="Current market value · sample"
          icon={BriefcaseBusiness}
          seed={4}
        />
        <StatCard
          label="Unrealized P&amp;L"
          value={formatSignedCurrency(gain)}
          change={formatPercent((gain / Math.max(marketValue - gain, 1)) * 100)}
          changeLabel="on cost basis"
          icon={TrendingUp}
          seed={7}
        />
        <StatCard
          label="Cash balance"
          value={formatCurrency(cash)}
          note="Paper account funds"
          icon={Command}
          seed={8}
        />
      </div>
      <div className="portfolio-overview-grid">
        <section className="panel portfolio-allocation-large">
          <PanelTitle
            title="Portfolio allocation"
            subtitle="Position value including available cash"
          />
          <div className="large-allocation-content">
            <div className="large-allocation-chart">
              <Suspense
                fallback={
                  <div
                    className="allocation-chart chart-loading"
                    aria-label="Loading allocation chart"
                  />
                }
              >
                <AllocationChart positions={allocation} />
              </Suspense>
              <div className="donut-center">
                <strong>{formatCompactCurrency(totalValue)}</strong>
                <span>Total value</span>
              </div>
            </div>
            <div className="allocation-legend allocation-legend-large">
              {allocation.map((item, index) => (
                <div className="legend-row" key={item.name}>
                  <span className={`legend-dot allocation-${index % 7}`} />
                  {item.name}
                  <small>{formatCurrency(item.value, 0)}</small>
                  <strong>
                    {((item.value / Math.max(totalValue, 1)) * 100).toFixed(1)}%
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel portfolio-note-panel">
          <PanelTitle
            title="Account summary"
            subtitle="Demo portfolio balances"
          />
          <div className="summary-list">
            <div>
              <span>Paper cash</span>
              <strong>{formatCurrency(cash)}</strong>
            </div>
            <div>
              <span>Invested market value</span>
              <strong>{formatCurrency(marketValue)}</strong>
            </div>
            <div>
              <span>Today's sample move</span>
              <strong className={dayChange >= 0 ? "positive" : "negative"}>
                {formatSignedCurrency(dayChange)}
              </strong>
            </div>
            <div>
              <span>Open paper orders</span>
              <strong>—</strong>
            </div>
          </div>
          <div className="demo-note-box">
            <Sparkles size={16} />
            <div>
              <strong>Paper account</strong>
              <p>
                Order activity updates this session only. No live account
                balances are connected.
              </p>
            </div>
          </div>
        </section>
      </div>
      <section className="panel full-table-panel">
        <PanelTitle
          title="Positions"
          subtitle={`${positions.length} holdings · Sample quotes`}
          action={
            <button
              className="small-outline-button"
              type="button"
              onClick={onExport}
            >
              <Download size={14} />
              Export
            </button>
          }
        />
        <PositionTable
          positions={positions}
          onSelect={onSelect}
          onTrade={onTrade}
        />
      </section>
    </>
  );
}

function MarketsView({
  watchlist,
  onToggleWatch,
  onSelect,
  onTrade,
  selectedSymbol,
  setSelectedSymbol,
}: any) {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("1D");
  const filtered = marketUniverse.filter(asset =>
    `${asset.symbol} ${asset.name} ${asset.sector}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  const selected = assetFor(selectedSymbol);
  return (
    <>
      <PageHeading
        title="Markets"
        subtitle="Follow sample quotes, review movers, and add symbols to your watchlist."
        action={
          <span className="demo-outline">
            <span className="demo-dot" />
            Sample market data
          </span>
        }
      />
      <div className="markets-layout">
        <section className="panel market-universe-panel">
          <PanelTitle
            title="Market universe"
            subtitle="A starter set of sample US-listed instruments"
            action={
              <div className="market-search">
                <Search size={15} />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Filter symbols"
                  aria-label="Filter market symbols"
                />
              </div>
            }
          />
          <AssetTable
            assets={filtered}
            watchlist={watchlist}
            onToggleWatch={onToggleWatch}
            onSelect={symbol => {
              setSelectedSymbol(symbol);
              onSelect(symbol);
            }}
            onTrade={onTrade}
          />
        </section>
        <section className="panel market-detail-panel">
          <PanelTitle
            title="Selected instrument"
            subtitle="Quote details and simulated trading"
            action={
              <button
                className="icon-button"
                type="button"
                aria-label="More quote actions"
                onClick={() =>
                  toast.info(
                    "Quote actions are limited to this sample-data view."
                  )
                }
              >
                <MoreHorizontal size={17} />
              </button>
            }
          />
          <div className="detail-head">
            <AssetMark asset={selected} size="lg" />
            <div>
              <div className="detail-symbol">
                {selected.symbol}
                <span className="exchange-tag">{selected.exchange}</span>
              </div>
              <div className="detail-name">{selected.name}</div>
            </div>
          </div>
          <div className="detail-price-row">
            <strong>{formatPrice(selected.price)}</strong>
            <Change value={selected.change} percent={selected.changePct} />
          </div>
          <div className="sample-quote-label">
            DEMO QUOTE · NOT A LIVE PRICE
          </div>
          <RangeSwitch value={range} onChange={setRange} />
          <Suspense
            fallback={
              <div
                className="asset-chart asset-chart-compact chart-loading"
                aria-label="Loading quote chart"
              />
            }
          >
            <AssetChart symbol={selected.symbol} range={range} compact />
          </Suspense>
          <div className="detail-stat-grid">
            <div>
              <span>Day change</span>
              <strong
                className={selected.change >= 0 ? "positive" : "negative"}
              >
                {formatSignedCurrency(selected.change)}
              </strong>
            </div>
            <div>
              <span>Day %</span>
              <strong
                className={selected.changePct >= 0 ? "positive" : "negative"}
              >
                {formatPercent(selected.changePct)}
              </strong>
            </div>
            <div>
              <span>Sector</span>
              <strong>{selected.sector}</strong>
            </div>
            <div>
              <span>Exchange</span>
              <strong>{selected.exchange}</strong>
            </div>
          </div>
          <p className="detail-description">{selected.description}</p>
          <div className="detail-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => onTrade(selected.symbol)}
            >
              Buy / sell
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => onToggleWatch(selected.symbol)}
            >
              <Star
                size={15}
                fill={watchlist.includes(selected.symbol) ? "#f3be72" : "none"}
              />
              {watchlist.includes(selected.symbol)
                ? "Watching"
                : "Add to watchlist"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function AnalysisView({ selectedSymbol, setSelectedSymbol, onTrade }: any) {
  const [tab, setTab] = useState<"Technical" | "Fundamental">("Technical");
  const [range, setRange] = useState("1M");
  const [showBands, setShowBands] = useState(false);
  const [indicator, setIndicator] = useState<"RSI" | "MACD">("RSI");
  const asset = assetFor(selectedSymbol);
  const fundamentals = useMemo(() => {
    const seed = Array.from(asset.symbol).reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0
    );
    return [
      {
        label: "Market capitalization",
        value: formatCompactCurrency(
          asset.price * ((seed % 9000) + 8500) * 1_000_000
        ),
      },
      {
        label: "P/E ratio",
        value: `${(18 + (seed % 31) + (seed % 7) / 10).toFixed(1)}×`,
      },
      { label: "Revenue growth", value: `${(5 + (seed % 19)).toFixed(1)}%` },
      { label: "Operating margin", value: `${(12 + (seed % 27)).toFixed(1)}%` },
      {
        label: "EPS (sample TTM)",
        value: formatCurrency(asset.price / (18 + (seed % 31)), 2),
      },
      {
        label: "Price / book",
        value: `${(2 + (seed % 15) + (seed % 6) / 10).toFixed(1)}×`,
      },
    ];
  }, [asset.price, asset.symbol]);
  return (
    <>
      <PageHeading
        title="Analysis"
        subtitle="Explore technical signals and illustrative company metrics."
        action={
          <button
            className="primary-button"
            type="button"
            onClick={() => onTrade(asset.symbol)}
          >
            Trade {asset.symbol}
          </button>
        }
      />
      <section className="panel analysis-header">
        <div className="analysis-company">
          <AssetMark asset={asset} size="lg" />
          <div>
            <div className="detail-symbol">
              {asset.symbol}
              <span className="exchange-tag">{asset.exchange}</span>
            </div>
            <div className="detail-name">
              {asset.name} · {asset.sector}
            </div>
          </div>
        </div>
        <div className="analysis-quote">
          <strong>{formatPrice(asset.price)}</strong>
          <Change value={asset.change} percent={asset.changePct} />
        </div>
        <label className="symbol-select-label">
          Symbol
          <select
            value={selectedSymbol}
            onChange={event => setSelectedSymbol(event.target.value)}
          >
            {marketUniverse.map(item => (
              <option key={item.symbol} value={item.symbol}>
                {item.symbol} — {item.name}
              </option>
            ))}
          </select>
        </label>
      </section>
      <div className="panel-tabs">
        <button
          className={tab === "Technical" ? "active" : ""}
          type="button"
          onClick={() => setTab("Technical")}
        >
          <ChartNoAxesCombined size={15} />
          Technical
        </button>
        <button
          className={tab === "Fundamental" ? "active" : ""}
          type="button"
          onClick={() => setTab("Fundamental")}
        >
          <FileText size={15} />
          Fundamental
        </button>
        <span className="demo-mini">ILLUSTRATIVE ANALYSIS</span>
      </div>
      {tab === "Technical" ? (
        <div className="analysis-layout">
          <section className="panel technical-panel">
            <PanelTitle
              title={`${asset.symbol} price action`}
              subtitle="Synthetic price series · Moving average overlay"
              action={<RangeSwitch value={range} onChange={setRange} />}
            />
            <div className="analysis-chart-legend">
              <span>
                <i className="legend-dot mint" />
                Demo price
              </span>
              <span>
                <i className="legend-line blue" />
                Moving average
              </span>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showBands}
                  onChange={event => setShowBands(event.target.checked)}
                />
                Bollinger bands
              </label>
            </div>
            <Suspense
              fallback={
                <div
                  className="asset-chart chart-loading"
                  aria-label="Loading technical chart"
                />
              }
            >
              <AssetChart
                symbol={asset.symbol}
                range={range}
                showAverage
                showBands={showBands}
              />
            </Suspense>
            <div className="indicator-controls">
              <div>
                <strong>Momentum indicator</strong>
                <span>Use as an educational visualization only</span>
              </div>
              <div className="segmented-control">
                <button
                  className={indicator === "RSI" ? "active" : ""}
                  type="button"
                  onClick={() => setIndicator("RSI")}
                >
                  RSI
                </button>
                <button
                  className={indicator === "MACD" ? "active" : ""}
                  type="button"
                  onClick={() => setIndicator("MACD")}
                >
                  MACD
                </button>
              </div>
            </div>
            <Suspense
              fallback={
                <div
                  className="indicator-chart chart-loading"
                  aria-label="Loading indicator chart"
                />
              }
            >
              <IndicatorChart symbol={asset.symbol} indicator={indicator} />
            </Suspense>
          </section>
          <aside className="analysis-aside">
            <div className="panel signal-panel">
              <PanelTitle
                title="Technical summary"
                subtitle="Illustrative indicator read"
              />
              <div className="signal-score">
                <span className="signal-icon">
                  <Activity size={17} />
                </span>
                <div>
                  <strong>Balanced</strong>
                  <small>Mixed sample signals</small>
                </div>
                <span className="signal-badge">NEUTRAL</span>
              </div>
              <div className="summary-list">
                <div>
                  <span>RSI (14)</span>
                  <strong>54.8 · Neutral</strong>
                </div>
                <div>
                  <span>MACD</span>
                  <strong>Near signal line</strong>
                </div>
                <div>
                  <span>Moving average</span>
                  <strong>Price above sample MA</strong>
                </div>
                <div>
                  <span>Volatility</span>
                  <strong>Moderate · indicative</strong>
                </div>
              </div>
              <p className="risk-disclaimer">
                Indicators are illustrative calculations on generated series,
                not current signals.
              </p>
            </div>
            <div className="panel learn-panel">
              <div className="learn-icon">
                <CircleHelp size={17} />
              </div>
              <strong>Use indicators thoughtfully</strong>
              <p>
                Technical measures summarize historical price patterns; they do
                not predict future performance.
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="fundamental-layout">
          <section className="panel fundamentals-panel">
            <PanelTitle
              title="Company fundamentals"
              subtitle="Illustrative metrics generated for the demo workspace"
              action={<span className="demo-mini">SAMPLE METRICS</span>}
            />
            <div className="fundamental-grid">
              {fundamentals.map(item => (
                <div className="fundamental-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>Illustrative · not provider data</small>
                </div>
              ))}
            </div>
            <div className="financial-table-wrap">
              <div className="table-section-heading">
                <div>
                  <strong>Sample financial profile</strong>
                  <span>Illustrative trailing-period values</span>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() =>
                    toast.info(
                      "Financial statements will appear when a fundamentals provider is connected."
                    )
                  }
                >
                  Statement detail <ChevronRight size={14} />
                </button>
              </div>
              <div className="financial-bars">
                {[
                  { name: "Revenue", value: 82, amount: "$142.8B" },
                  { name: "Gross profit", value: 61, amount: "$68.2B" },
                  { name: "Operating income", value: 38, amount: "$34.1B" },
                  { name: "Net income", value: 28, amount: "$26.7B" },
                ].map(row => (
                  <div className="financial-row" key={row.name}>
                    <span>{row.name}</span>
                    <div className="financial-track">
                      <i style={{ width: `${row.value}%` }} />
                    </div>
                    <strong>{row.amount}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <aside className="panel company-card">
            <PanelTitle title="Company profile" subtitle="Sample description" />
            <AssetMark asset={asset} size="lg" />
            <h3>{asset.name}</h3>
            <div className="profile-tag">{asset.sector}</div>
            <p>{asset.description}</p>
            <div className="summary-list">
              <div>
                <span>Exchange</span>
                <strong>{asset.exchange}</strong>
              </div>
              <div>
                <span>Symbol</span>
                <strong>{asset.symbol}</strong>
              </div>
              <div>
                <span>Data source</span>
                <strong>Demo values</strong>
              </div>
            </div>
            <div className="demo-warning">
              <Sparkles size={15} />
              Connect a provider to show sourced financial statements.
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function RiskView({ positions, marketValue, totalValue, cash }: any) {
  const totalExposure = Math.max(marketValue, 1);
  const exposures = positions
    .map((position: Position) => ({
      asset: assetFor(position.symbol),
      value: position.shares * assetFor(position.symbol).price,
    }))
    .sort((a: any, b: any) => b.value - a.value);
  const largest = exposures[0]?.value ?? 0;
  const hhi = exposures.reduce(
    (sum: number, entry: any) => sum + Math.pow(entry.value / totalExposure, 2),
    0
  );
  const concentration = Math.min(100, Math.round(hhi * 100));
  const sectors = new Map<string, number>();
  exposures.forEach((entry: any) =>
    sectors.set(
      entry.asset.sector,
      (sectors.get(entry.asset.sector) ?? 0) + entry.value
    )
  );
  const sectorList = Array.from(sectors.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  return (
    <>
      <PageHeading
        title="Risk & exposure"
        subtitle="Understand concentration and diversification in this sample portfolio."
        action={
          <span className="demo-outline">
            <ShieldAlert size={14} />
            Illustrative risk view
          </span>
        }
      />
      <div className="risk-hero-grid">
        <section className="panel risk-score-panel">
          <PanelTitle
            title="Portfolio risk profile"
            subtitle="A demo score derived from position concentration"
          />
          <div className="risk-score-content">
            <div className="risk-score-wheel">
              <div>
                <strong>{concentration}</strong>
                <span>of 100</span>
              </div>
            </div>
            <div className="risk-score-copy">
              <div className="risk-score-label">
                {concentration > 42
                  ? "Moderate concentration"
                  : "Broadly allocated"}
              </div>
              <p>
                This simplified demo score summarizes position concentration. It
                is not a forecast, personalized advice, or a complete risk
                model.
              </p>
              <div className="risk-score-tags">
                <span>
                  <i className="risk-dot amber" />
                  Concentration {concentration > 42 ? "elevated" : "balanced"}
                </span>
                <span>
                  <i className="risk-dot mint" />
                  Cash{" "}
                  {formatPercent((cash / Math.max(totalValue, 1)) * 100, 0)} of
                  account
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="panel exposure-panel">
          <PanelTitle
            title="Top position exposure"
            subtitle="Share of invested value"
          />
          <div className="exposure-list">
            {exposures.slice(0, 5).map((entry: any) => (
              <div className="exposure-row" key={entry.asset.symbol}>
                <div className="exposure-heading">
                  <span>{entry.asset.symbol}</span>
                  <strong>
                    {formatPercent((entry.value / totalExposure) * 100, 1)}
                  </strong>
                </div>
                <div className="exposure-track">
                  <span
                    style={{ width: `${(entry.value / totalExposure) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="risk-detail-grid">
        <section className="panel sector-risk-panel">
          <PanelTitle
            title="Sector allocation"
            subtitle="Grouped using sample instrument labels"
          />
          <div className="sector-list">
            {sectorList.map((sector, index) => (
              <div className="sector-row" key={sector.name}>
                <span className={`legend-dot allocation-${index % 7}`} />
                <span>{sector.name}</span>
                <div className="sector-track">
                  <i
                    style={{
                      width: `${(sector.value / totalExposure) * 100}%`,
                    }}
                  />
                </div>
                <strong>
                  {formatPercent((sector.value / totalExposure) * 100, 1)}
                </strong>
              </div>
            ))}
          </div>
          <div className="risk-note">
            <ShieldAlert size={16} />
            <p>
              Sector labels and exposures are demo classifications. Actual
              portfolio risk depends on holdings, prices, correlations, and your
              time horizon.
            </p>
          </div>
        </section>
        <section className="panel risk-factors-panel">
          <PanelTitle
            title="Risk factors"
            subtitle="What this demo view considers"
          />
          <div className="risk-factor">
            <span className="factor-icon amber">
              <ChartNoAxesCombined size={16} />
            </span>
            <div>
              <strong>Concentration</strong>
              <p>
                Largest holding is {exposures[0]?.asset.symbol ?? "—"} (
                {formatPercent((largest / totalExposure) * 100, 1)} of invested
                value).
              </p>
            </div>
            <span className="factor-status">Watch</span>
          </div>
          <div className="risk-factor">
            <span className="factor-icon blue">
              <Activity size={16} />
            </span>
            <div>
              <strong>Volatility</strong>
              <p>Not measured from a sourced historical series in demo mode.</p>
            </div>
            <span className="factor-status muted">Unavailable</span>
          </div>
          <div className="risk-factor">
            <span className="factor-icon mint">
              <BriefcaseBusiness size={16} />
            </span>
            <div>
              <strong>Diversification</strong>
              <p>
                {sectorList.length} sample sector classifications across{" "}
                {positions.length} positions.
              </p>
            </div>
            <span className="factor-status">Partial</span>
          </div>
          <div className="risk-factor">
            <span className="factor-icon coral">
              <TrendingDown size={16} />
            </span>
            <div>
              <strong>Drawdown</strong>
              <p>Historical drawdown requires a connected time series.</p>
            </div>
            <span className="factor-status muted">Unavailable</span>
          </div>
        </section>
      </div>
    </>
  );
}

function OrdersView({ orders, onCancel, onTrade }: any) {
  const [filter, setFilter] = useState("All orders");
  const filtered =
    filter === "All orders"
      ? orders
      : orders.filter(
          (order: PaperOrder) =>
            order.status ===
            filter.replace(" orders", "").replace(" orders", "")
        );
  const normalized =
    filter === "Open orders"
      ? orders.filter((order: PaperOrder) => order.status === "Open")
      : filter === "Filled orders"
        ? orders.filter((order: PaperOrder) => order.status === "Filled")
        : filter === "Cancelled orders"
          ? orders.filter((order: PaperOrder) => order.status === "Cancelled")
          : filtered;
  return (
    <>
      <PageHeading
        title="Orders & activity"
        subtitle="Review sample order history and manage simulated open orders."
        action={
          <button
            className="primary-button"
            type="button"
            onClick={() => onTrade("NVDA")}
          >
            <Plus size={16} />
            New paper order
          </button>
        }
      />
      <div className="order-summary-stats">
        <div>
          <span>All orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Open</span>
          <strong>
            {
              orders.filter((order: PaperOrder) => order.status === "Open")
                .length
            }
          </strong>
        </div>
        <div>
          <span>Filled</span>
          <strong>
            {
              orders.filter((order: PaperOrder) => order.status === "Filled")
                .length
            }
          </strong>
        </div>
        <div>
          <span>Cancelled</span>
          <strong>
            {
              orders.filter((order: PaperOrder) => order.status === "Cancelled")
                .length
            }
          </strong>
        </div>
      </div>
      <section className="panel orders-page-panel">
        <PanelTitle
          title="Order history"
          subtitle="Paper trading · No broker connected"
          action={
            <label className="filter-select">
              <SlidersHorizontal size={14} />
              <select
                value={filter}
                onChange={event => setFilter(event.target.value)}
              >
                <option>All orders</option>
                <option>Open orders</option>
                <option>Filled orders</option>
                <option>Cancelled orders</option>
              </select>
              <ChevronDown size={14} />
            </label>
          }
        />
        <OrderTable orders={normalized} onCancel={onCancel} />
        <div className="orders-disclaimer">
          <ShieldAlert size={15} />
          Sample rows are illustrative. New orders alter only this browser
          session's paper portfolio.
        </div>
      </section>
    </>
  );
}

export default function Home() {
  const portfolio = usePaperPortfolio();
  const [view, setView] = useState<ViewKey>("Overview");
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [watchlist, setWatchlist] = useState<string[]>(initialWatchlist);
  const [tradeSymbol, setTradeSymbol] = useState("NVDA");
  const [orderOpen, setOrderOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  const searchResults = marketUniverse
    .filter(asset =>
      `${asset.symbol} ${asset.name}`
        .toLowerCase()
        .includes(searchText.trim().toLowerCase())
    )
    .slice(0, 5);
  const goTo = (next: ViewKey) => {
    setView(next);
    setMobileNavOpen(false);
  };
  const openTrade = (symbol: string) => {
    setTradeSymbol(symbol);
    setOrderOpen(true);
  };
  const selectAsset = (symbol: string) => {
    setSelectedSymbol(symbol);
    setView("Markets");
    setSearchText("");
  };
  const toggleWatch = (symbol: string) =>
    setWatchlist(current =>
      current.includes(symbol)
        ? current.filter(item => item !== symbol)
        : [...current, symbol]
    );
  const submitPaperOrder = (
    order: Parameters<typeof portfolio.submitOrder>[0]
  ) => {
    const result = portfolio.submitOrder(order);
    if (result.ok)
      toast.success(result.message, {
        description: `${order.side} ${order.shares} ${order.symbol} · paper account`,
      });
    else toast.error(result.message);
    return result;
  };
  const cancelPaperOrder = (id: string) => {
    portfolio.cancelOrder(id);
    toast.success("Paper order cancelled.");
  };
  const pageAction = (
    <button
      className="icon-button header-bell"
      type="button"
      aria-label="Notifications"
      onClick={() => toast.info("No new demo notifications.")}
    >
      <Bell size={18} />
      <i />
    </button>
  );

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <img src="/portfolio-mark.png" alt="" className="brand-mark" />
          <span className="brand-name">
            Portfolio<span>Pro</span>
          </span>
          <button
            className="icon-button sidebar-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems
            .filter(item => item.group === "workspace")
            .map(item => (
              <button
                key={item.label}
                className={`nav-item ${view === item.label ? "active" : ""}`}
                type="button"
                onClick={() => goTo(item.label)}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
                {item.label === "Markets" && (
                  <span className="nav-count">12</span>
                )}
              </button>
            ))}
        </nav>
        <div className="sidebar-caption manage-caption">MANAGE</div>
        <nav className="primary-nav" aria-label="Manage">
          {navItems
            .filter(item => item.group === "manage")
            .map(item => (
              <button
                key={item.label}
                className={`nav-item ${view === item.label ? "active" : ""}`}
                type="button"
                onClick={() => goTo(item.label)}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
                {item.label === "Orders" &&
                  portfolio.orders.some(order => order.status === "Open") && (
                    <span className="nav-count">
                      {
                        portfolio.orders.filter(
                          order => order.status === "Open"
                        ).length
                      }
                    </span>
                  )}
              </button>
            ))}
        </nav>
        <div className="sidebar-watchlist">
          <div className="sidebar-caption">
            WATCHLIST{" "}
            <button
              type="button"
              onClick={() => goTo("Markets")}
              aria-label="Manage watchlist"
            >
              <Plus size={13} />
            </button>
          </div>
          {watchlist.slice(0, 5).map(symbol => {
            const asset = assetFor(symbol);
            return (
              <button
                className="watch-row"
                type="button"
                key={symbol}
                onClick={() => selectAsset(symbol)}
              >
                <AssetMark asset={asset} size="sm" />
                <span>{symbol}</span>
                <span className={asset.change >= 0 ? "positive" : "negative"}>
                  {formatPercent(asset.changePct, 1)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <button
            type="button"
            onClick={() =>
              toast.info(
                "Help and account settings will be available in a connected account workspace."
              )
            }
          >
            <CircleHelp size={16} />
            Help center
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={() =>
              toast.info("Preferences are not saved in this UI demo.")
            }
          >
            <Settings2 size={16} />
            Preferences
            <ChevronRight size={14} />
          </button>
        </div>
        <button
          className="profile-card"
          type="button"
          onClick={() => setProfileOpen(value => !value)}
        >
          <span className="profile-avatar">JD</span>
          <span className="profile-copy">
            <strong>Jordan Davis</strong>
            <small>Demo investor</small>
          </span>
          <MoreHorizontal size={17} />
        </button>
      </aside>
      {mobileNavOpen && (
        <button
          className="mobile-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={19} />
            </button>
            <div className="breadcrumb">
              <span>PortfolioPro</span>
              <ChevronRight size={14} />
              <strong>{view}</strong>
            </div>
          </div>
          <div className="topbar-center">
            <div className="global-search">
              <Search size={16} />
              <input
                ref={searchInputRef}
                value={searchText}
                onChange={event => setSearchText(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Escape") setSearchText("");
                  if (event.key === "Enter" && searchResults[0])
                    selectAsset(searchResults[0].symbol);
                }}
                placeholder="Search symbols or companies"
                aria-label="Search market symbols"
              />
              {searchText && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchText("")}
                >
                  <X size={14} />
                </button>
              )}
              <kbd>⌘ K</kbd>
              {searchText && (
                <div className="search-results" role="listbox">
                  {searchResults.map(asset => (
                    <button
                      type="button"
                      key={asset.symbol}
                      role="option"
                      aria-selected={false}
                      onClick={() => selectAsset(asset.symbol)}
                    >
                      <AssetMark asset={asset} size="sm" />
                      <span className="instrument-copy">
                        <strong>{asset.symbol}</strong>
                        <small>{asset.name}</small>
                      </span>
                      <span className="numeric">
                        {formatPrice(asset.price)}
                      </span>
                    </button>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="search-empty">No sample symbols found</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="topbar-right">
            {pageAction}
            <button
              className="top-avatar"
              type="button"
              aria-label="Open demo profile"
              onClick={() => setProfileOpen(value => !value)}
            >
              JD
            </button>
          </div>
          {profileOpen && (
            <div className="profile-popover">
              <strong>Jordan Davis</strong>
              <span>Demo investor</span>
              <hr />
              <span className="demo-pill">
                <span className="demo-dot" />
                PAPER ACCOUNT
              </span>
              <p>This sample profile is not connected to a real brokerage.</p>
            </div>
          )}
        </header>
        <main className="content-area">
          <div className="demo-banner">
            <div className="demo-banner-mark">
              <Sparkles size={15} />
            </div>
            <div>
              <strong>Demo workspace</strong>
              <span>
                All quotes are sample data. Orders are simulated and never reach
                a broker.
              </span>
            </div>
            <DemoTag />
            <button
              className="banner-close"
              type="button"
              aria-label="Dismiss demo notice"
              onClick={event =>
                event.currentTarget.parentElement?.classList.add("dismissed")
              }
            >
              <X size={15} />
            </button>
          </div>
          {view === "Overview" && (
            <OverviewView
              totalValue={portfolio.totalValue}
              marketValue={portfolio.marketValue}
              cash={portfolio.cash}
              dayChange={portfolio.dayChange}
              positions={portfolio.positions}
              orders={portfolio.orders}
              watchlist={watchlist}
              onToggleWatch={toggleWatch}
              onSelect={selectAsset}
              onTrade={openTrade}
              onNavigate={goTo}
              onCancel={cancelPaperOrder}
            />
          )}
          {view === "Portfolio" && (
            <PortfolioView
              totalValue={portfolio.totalValue}
              marketValue={portfolio.marketValue}
              cash={portfolio.cash}
              dayChange={portfolio.dayChange}
              positions={portfolio.positions}
              onSelect={selectAsset}
              onTrade={openTrade}
              onExport={() => downloadPortfolioCsv(portfolio.positions)}
            />
          )}
          {view === "Markets" && (
            <MarketsView
              watchlist={watchlist}
              onToggleWatch={toggleWatch}
              onSelect={selectAsset}
              onTrade={openTrade}
              selectedSymbol={selectedSymbol}
              setSelectedSymbol={setSelectedSymbol}
            />
          )}
          {view === "Analysis" && (
            <AnalysisView
              selectedSymbol={selectedSymbol}
              setSelectedSymbol={setSelectedSymbol}
              onTrade={openTrade}
            />
          )}
          {view === "Risk" && (
            <RiskView
              positions={portfolio.positions}
              marketValue={portfolio.marketValue}
              totalValue={portfolio.totalValue}
              cash={portfolio.cash}
            />
          )}
          {view === "Orders" && (
            <OrdersView
              orders={portfolio.orders}
              onCancel={cancelPaperOrder}
              onTrade={openTrade}
            />
          )}
          <footer className="page-footer">
            <span>
              PortfolioPro <span className="footer-dot">·</span> Demo workspace
            </span>
            <span>
              Sample data only <span className="footer-dot">·</span> Not
              investment advice
            </span>
          </footer>
        </main>
      </div>
      <OrderDialog
        open={orderOpen}
        symbol={tradeSymbol}
        cash={portfolio.cash}
        positions={portfolio.positions}
        onClose={() => setOrderOpen(false)}
        onSubmit={submitPaperOrder}
      />
    </div>
  );
}
