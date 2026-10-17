import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  assetFor,
  formatCurrency,
  makePortfolioSeries,
  makePriceSeries,
} from "./types";

const tooltipStyle = {
  background: "#17212c",
  border: "1px solid #2a3744",
  borderRadius: 10,
  color: "#e9f1f4",
  fontSize: 12,
};

export function PortfolioChart({
  value,
  range,
}: {
  value: number;
  range: string;
}) {
  const data = useMemo(
    () => makePortfolioSeries(value, 42, range),
    [value, range]
  );
  const first = data[0]?.value ?? value;
  const finalValue = data[data.length - 1]?.value ?? value;
  const up = finalValue >= first;
  const color = up ? "#75e2b5" : "#ff8e9a";
  return (
    <div className="portfolio-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 4, left: 2, bottom: 0 }}
        >
          <defs>
            <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.21} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#25323d"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#768692", fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#768692", fontSize: 10 }}
            tickFormatter={(n: number) => `$${Math.round(n / 1000)}k`}
            width={44}
            domain={[
              (dataMin: number) => dataMin * 0.986,
              (dataMax: number) => dataMax * 1.008,
            ]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={n => [formatCurrency(Number(n), 0), "Portfolio"]}
            labelStyle={{ color: "#9cabb5" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.4}
            fill="url(#portfolioFill)"
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AssetChart({
  symbol,
  range,
  showAverage = true,
  showBands = false,
  compact = false,
}: {
  symbol: string;
  range: string;
  showAverage?: boolean;
  showBands?: boolean;
  compact?: boolean;
}) {
  const asset = assetFor(symbol);
  const count = range === "1D" ? 48 : range === "1W" ? 35 : 56;
  const data = useMemo(
    () => makePriceSeries(symbol, asset.price, count, range),
    [symbol, asset.price, count, range]
  );
  return (
    <div className={`asset-chart ${compact ? "asset-chart-compact" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="assetFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#77dbb1" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#77dbb1" stopOpacity={0} />
            </linearGradient>
          </defs>
          {!compact && (
            <CartesianGrid
              stroke="#25323d"
              strokeDasharray="3 5"
              vertical={false}
            />
          )}
          <XAxis
            dataKey="label"
            hide={compact}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#758692", fontSize: 10 }}
            interval="preserveStartEnd"
          />
          {!compact && (
            <YAxis
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#758692", fontSize: 10 }}
              tickFormatter={(n: number) => `$${n.toFixed(0)}`}
              width={42}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
          )}
          {!compact && (
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={n => [formatCurrency(Number(n)), "Price"]}
              labelStyle={{ color: "#9cabb5" }}
            />
          )}
          {showBands && (
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#85a9ff"
              fillOpacity={0.035}
              isAnimationActive={false}
            />
          )}
          {showBands && (
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#111923"
              fillOpacity={1}
              isAnimationActive={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#75e2b5"
            strokeWidth={compact ? 1.6 : 2.2}
            fill="url(#assetFill)"
            activeDot={
              compact ? false : { r: 3, fill: "#75e2b5", strokeWidth: 0 }
            }
            isAnimationActive={false}
          />
          {showAverage && !compact && (
            <Line
              type="monotone"
              dataKey="average"
              stroke="#85a9ff"
              strokeWidth={1.2}
              strokeDasharray="4 5"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IndicatorChart({
  symbol,
  indicator,
}: {
  symbol: string;
  indicator: "RSI" | "MACD";
}) {
  const asset = assetFor(symbol);
  const data = useMemo(
    () => makePriceSeries(symbol, asset.price, 45),
    [symbol, asset.price]
  );
  return (
    <div className="indicator-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 4, left: 2, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#25323d"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis dataKey="label" hide axisLine={false} tickLine={false} />
          <YAxis
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#758692", fontSize: 10 }}
            width={32}
            domain={indicator === "RSI" ? [20, 80] : ["auto", "auto"]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={n => [Number(n).toFixed(2), indicator]}
          />
          <Line
            type="monotone"
            dataKey={indicator === "RSI" ? "rsi" : "macd"}
            stroke={indicator === "RSI" ? "#88aaff" : "#f2b66f"}
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const allocationColors = [
  "#75e2b5",
  "#83aaff",
  "#f2b66f",
  "#c098ff",
  "#6fcbd0",
  "#ff8e9a",
  "#8c9daa",
];
export function AllocationChart({
  positions,
  compact = false,
}: {
  positions: { name: string; value: number }[];
  compact?: boolean;
}) {
  const data = positions
    .filter(item => item.value > 0)
    .map((item, index) => ({
      ...item,
      fill: allocationColors[index % allocationColors.length],
    }));
  return (
    <div
      className={`allocation-chart ${compact ? "allocation-chart-compact" : ""}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={compact ? 44 : 56}
            outerRadius={compact ? 63 : 80}
            paddingAngle={3}
            stroke="none"
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={value => [formatCurrency(Number(value), 0), "Value"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
