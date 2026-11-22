"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Layers,
  Sparkles,
  Percent,
  Coins,
} from "lucide-react";
import {
  CategoryBarChartProps,
  CategoryAnalysisType,
  CategoryMetricDisplay,
  CategoryAnalyticsItem,
} from "@/types/analytics.types";
import { formatCompactINR, formatINR } from "@/lib/formatters";

export function CategoryBarChart({
  inflowCategories,
  outflowCategories,
  combinedCategories,
  defaultType = "COMBINED",
}: CategoryBarChartProps) {
  const [activeType, setActiveType] =
    useState<CategoryAnalysisType>(defaultType);
  const [metricMode, setMetricMode] =
    useState<CategoryMetricDisplay>("percentage");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentData =
    activeType === "OUTFLOW"
      ? outflowCategories
      : activeType === "INFLOW"
        ? inflowCategories
        : combinedCategories;

  const { items, averageAmount, averagePercentage, totalCategoryAmount } =
    currentData;

  const metricDataKey =
    metricMode === "percentage" ? "percentage" : "totalAmount";
  const benchmarkValue =
    metricMode === "percentage" ? averagePercentage : averageAmount;

  const benchmarkLabel =
    metricMode === "percentage"
      ? `Avg ${averagePercentage.toFixed(1)}%`
      : `Avg ${formatCompactINR(averageAmount)}`;

  // Formatter for top-of-bar labels (matches screenshot with percentages/amounts on top)
  const renderCustomTopLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    if (value === undefined || value === null) return null;
    const item = items[index];
    const isInflow = item?.type === "INFLOW";
    const formatted =
      metricMode === "percentage"
        ? `${Number(value).toFixed(1)}%`
        : formatCompactINR(value);

    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill={isInflow ? "#34d399" : "#fb7185"}
        textAnchor="middle"
        fontSize={10.5}
        fontWeight={700}
        fontFamily="monospace"
      >
        {formatted}
      </text>
    );
  };

  // Tooltip custom component
  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: CategoryAnalyticsItem = payload[0].payload;
      const isInflow = item.type === "INFLOW";
      return (
        <div className="bg-surface-modal/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl p-4 shadow-2xl text-xs w-72">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isInflow ? "bg-emerald-400" : "bg-rose-400"
                }`}
              />
              <span className="font-bold text-white text-sm">
                {item.category}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                  isInflow
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
              >
                {isInflow ? "↗ Inflow" : "↘ Outflow"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-bold">
                Rank #{item.rank}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Total Volume:</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatINR(item.totalAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Category Share:</span>
              <span
                className={`font-mono font-bold ${
                  isInflow ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {item.percentage}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Transaction Count:</span>
              <span className="font-mono text-neutral-200">
                {item.transactionCount} transactions
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
              <span className="text-neutral-400">Avg Ticket Size:</span>
              <span className="font-mono font-semibold text-neutral-300">
                {formatINR(item.avgTransactionAmount)}
              </span>
            </div>

            {item.isTop && (
              <div
                className={`mt-2 p-2 rounded-xl border flex items-center gap-1.5 text-[11px] font-semibold ${
                  isInflow
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Highest Volume Category ({item.percentage}% share)</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const topCategory = items[0];
  const lowestCategory = items.length > 1 ? items[items.length - 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
      className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl space-y-6"
    >
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              Category Distribution & Benchmark
            </h3>
            <p className="text-xs text-neutral-400">
              Ranked category share with dynamic average benchmark line
            </p>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segment Filter (Outflow, Inflow, Combined) */}
          <div
            className="flex items-center bg-surface border border-neutral-800 rounded-xl p-1 gap-1"
            suppressHydrationWarning
          >
            <button
              type="button"
              onClick={() => setActiveType("OUTFLOW")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "OUTFLOW"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Outflows</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType("INFLOW")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "INFLOW"
                  ? "bg-primary/20 text-primary border border-primary/40 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Inflows</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType("COMBINED")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "COMBINED"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Combined</span>
            </button>
          </div>

          {/* Metric Mode Toggle (% Share vs ₹ Amount) */}
          <div className="flex items-center bg-surface border border-neutral-800 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setMetricMode("percentage")}
              title="Percentage Share (%)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                metricMode === "percentage"
                  ? "bg-neutral-800 text-white font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-primary" />
              <span>% Share</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("amount")}
              title="Total Amount (₹)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                metricMode === "amount"
                  ? "bg-neutral-800 text-white font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Amount (₹)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subheader Badges (Matches screenshot badges) */}
      <div
        className="flex flex-wrap items-center gap-3 pt-1"
        suppressHydrationWarning
      >
        {/* Inflow vs Outflow Visual Legend */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-surface border border-neutral-800 text-xs shadow-sm">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span>Inflow (Green)</span>
          </div>
          <span className="text-neutral-600">|</span>
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]" />
            <span>Outflow (Red)</span>
          </div>
        </div>

        {/* Top Hero Category Badge */}
        {topCategory && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              topCategory.type === "INFLOW"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
            suppressHydrationWarning
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-bold text-white">#1 Hero Category:</span>
            <span className="font-bold">{topCategory.category}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                topCategory.type === "INFLOW"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/20 text-rose-300"
              }`}
            >
              {topCategory.type === "INFLOW" ? "Inflow" : "Outflow"}
            </span>
            <span className="text-neutral-500">•</span>
            <span
              className="font-mono font-bold text-white"
              suppressHydrationWarning
            >
              {formatINR(topCategory.totalAmount)}
            </span>
            <span className="text-neutral-400" suppressHydrationWarning>
              ({topCategory.percentage}%)
            </span>
          </div>
        )}

        {/* Benchmark Baseline Badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs"
          suppressHydrationWarning
        >
          <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400" />
          <span className="font-bold text-white">
            Category Average Baseline:
          </span>
          <span
            className="font-mono font-bold text-amber-400"
            suppressHydrationWarning
          >
            {metricMode === "percentage"
              ? `${averagePercentage.toFixed(1)}%`
              : formatINR(averageAmount)}
          </span>
        </div>

        {/* Total Categories Tracked */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/80 border border-neutral-800 text-xs text-neutral-400">
          <span>Tracked Categories:</span>
          <span className="font-mono font-bold text-white">{items.length}</span>
        </div>
      </div>

      {/* Recharts BarChart Canvas (Matches Reference Screenshot) */}
      {(() => {
        const shouldAngle =
          items.length > 6 || items.some((i) => i.category.length > 9);

        return (
          <div className="w-full h-[450px] pt-4 select-none">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                <p className="text-sm font-medium text-neutral-300">
                  No records found.
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Use &quot;+ Add Inflow&quot; or &quot;- Add Outflow&quot;
                  above to start logging.
                </p>
              </div>
            ) : !isMounted ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-neutral-500 animate-pulse">
                Loading category chart...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={items}
                  margin={{
                    top: 25,
                    right: 30,
                    left: 10,
                    bottom: shouldAngle ? 55 : 25,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#262626"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="category"
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#262626" }}
                    interval={0}
                    height={shouldAngle ? 70 : 35}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      const item = items.find(
                        (i) => i.category === payload.value
                      );
                      const isInflow = item?.type === "INFLOW";
                      const rawVal = String(payload.value || "");
                      const displayName =
                        rawVal.length > 15 ? `${rawVal.slice(0, 14)}…` : rawVal;

                      if (shouldAngle) {
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              transform="rotate(-35)"
                              x={-4}
                              y={10}
                              textAnchor="end"
                              fill={isInflow ? "#34d399" : "#fb7185"}
                              fontSize={10.5}
                              fontWeight={600}
                              className="cursor-pointer select-none"
                            >
                              <title>{rawVal}</title>
                              {displayName}
                            </text>
                          </g>
                        );
                      }

                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={12}
                            textAnchor="middle"
                            fill={isInflow ? "#34d399" : "#fb7185"}
                            fontSize={10.5}
                            fontWeight={600}
                            className="cursor-pointer select-none"
                          >
                            <title>{rawVal}</title>
                            {displayName}
                          </text>
                        </g>
                      );
                    }}
                  />

                  <YAxis
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#262626" }}
                    tickFormatter={(v) =>
                      metricMode === "percentage"
                        ? `${v}%`
                        : formatCompactINR(v)
                    }
                    width={65}
                  />

                  <Tooltip
                    content={<CustomCategoryTooltip />}
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                  />

                  {/* Dashed Benchmark Reference Line (Matches screenshot '-- Nifty 12.30%') */}
                  {benchmarkValue > 0 && (
                    <ReferenceLine
                      y={benchmarkValue}
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                      strokeWidth={1.5}
                      label={{
                        value: `-- ${benchmarkLabel}`,
                        position: "right",
                        fill: "#f59e0b",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                  )}

                  {/* Bar Component with Rounded Tops and Top Value Labels */}
                  <Bar
                    dataKey={metricDataKey}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={55}
                  >
                    <LabelList content={renderCustomTopLabel} />
                    {items.map((entry, index) => {
                      const isTop = entry.isTop;
                      const isInflow = entry.type === "INFLOW";

                      // Inflow: Emerald Green (#10b981), Outflow: Coral/Rose Red (#f43f5e)
                      const fillColor = isInflow ? "#10b981" : "#f43f5e";

                      return (
                        <Cell
                          key={`cell-${entry.category}-${index}`}
                          fill={fillColor}
                          className={
                            isTop
                              ? isInflow
                                ? "filter drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] cursor-pointer"
                                : "filter drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] cursor-pointer"
                              : "cursor-pointer hover:opacity-90 transition-opacity"
                          }
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        );
      })()}

      {/* Axis Label Centered Below Graph (Matches 'Family Member' in screenshot) */}
      <div className="text-center -mt-2">
        <span className="text-xs font-bold text-neutral-400 tracking-wider uppercase">
          Category
        </span>
      </div>

      {/* Bento Breakdown Cards (Inspired by top Dribbble/Pinterest Fintech Patterns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-neutral-800">
        {/* Bento 1: Top Hero Category */}
        <div
          className={`p-3.5 rounded-xl bg-surface border flex flex-col justify-between ${
            topCategory?.type === "INFLOW"
              ? "border-emerald-500/30"
              : "border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-400 font-semibold">Top Category</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                topCategory?.type === "INFLOW"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {topCategory?.type === "INFLOW" ? "Inflow" : "Outflow"}
            </span>
          </div>
          <p className="text-sm font-bold text-white truncate">
            {topCategory?.category || "None"}
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-base font-bold font-mono ${
                topCategory?.type === "INFLOW"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {topCategory ? formatINR(topCategory.totalAmount) : "₹ 0"}
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                topCategory?.type === "INFLOW"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {topCategory?.percentage || 0}%
            </span>
          </div>
        </div>

        {/* Bento 2: Category Average */}
        <div className="p-3.5 rounded-xl bg-surface border border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-400 font-semibold">
              Category Average
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <p className="text-sm font-bold text-white">Baseline Benchmark</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-base font-bold font-mono text-amber-400">
              {formatINR(averageAmount)}
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {averagePercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Bento 3: Lowest / Smallest Category */}
        <div
          className={`p-3.5 rounded-xl bg-surface border flex flex-col justify-between ${
            lowestCategory?.type === "INFLOW"
              ? "border-emerald-500/30"
              : "border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-400 font-semibold">Lowest Share</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                lowestCategory?.type === "INFLOW"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {lowestCategory?.type === "INFLOW" ? "Inflow" : "Outflow"}
            </span>
          </div>
          <p className="text-sm font-bold text-white truncate">
            {lowestCategory?.category || "None"}
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-base font-bold font-mono ${
                lowestCategory?.type === "INFLOW"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {lowestCategory ? formatINR(lowestCategory.totalAmount) : "₹ 0"}
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                lowestCategory?.type === "INFLOW"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {lowestCategory?.percentage || 0}%
            </span>
          </div>
        </div>

        {/* Bento 4: Total Volume */}
        <div className="p-3.5 rounded-xl bg-surface border border-neutral-700/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-400 font-semibold">Group Volume</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          </div>
          <p className="text-sm font-bold text-white">Total Classified</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-base font-bold font-mono text-white">
              {formatINR(totalCategoryAmount)}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {items.length} Cats
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
