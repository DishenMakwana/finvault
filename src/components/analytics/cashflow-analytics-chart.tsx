"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  type ChangeEvent,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  ChevronDown,
  X,
  Building2,
  Tag,
} from "lucide-react";
import {
  CashflowAnalyticsChartProps,
  AnalyticsDatePreset,
  AnalyticsViewMode,
  AnalyticsDataPoint,
} from "@/types/analytics.types";
import { formatCompactINR, formatINR } from "@/lib/formatters";

export function CashflowAnalyticsChart({
  initialData,
  houses,
  currentHouseId = "ALL",
  currentRange = "1Y",
  currentStartDate,
  currentEndDate,
  currentMode = "cumulative",
}: CashflowAnalyticsChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<AnalyticsViewMode>(currentMode);
  const [isMounted, setIsMounted] = useState(false);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [customStart, setCustomStart] = useState(
    currentStartDate || initialData.summary.startDate || ""
  );
  const [customEnd, setCustomEnd] = useState(
    currentEndDate || initialData.summary.endDate || ""
  );

  const customDateRef = useRef<HTMLDivElement>(null);

  // Mount check and close custom date dropdown on outside click
  useEffect(() => {
    setIsMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (
        customDateRef.current &&
        !customDateRef.current.contains(event.target as Node)
      ) {
        setIsCustomDateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleRangeChange = (preset: AnalyticsDatePreset) => {
    if (preset === "CUSTOM") {
      setIsCustomDateOpen(true);
      return;
    }
    setIsCustomDateOpen(false);
    updateFilters({
      range: preset,
      startDate: null,
      endDate: null,
    });
  };

  const handleApplyCustomDate = () => {
    if (!customStart || !customEnd) return;
    setIsCustomDateOpen(false);
    updateFilters({
      range: "CUSTOM",
      startDate: customStart,
      endDate: customEnd,
    });
  };

  const handleHouseChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ houseId: e.target.value });
  };

  const { points, summary } = initialData;

  const inflowDataKey =
    viewMode === "cumulative" ? "cumulativeInflow" : "inflow";
  const outflowDataKey =
    viewMode === "cumulative" ? "cumulativeOutflow" : "outflow";

  // Custom Dot for INFLOW: renders green circle if point has inflow transactions
  const renderInflowDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    if (!payload?.hasInflow) {
      return <g key={`inflow-empty-${index}`} />;
    }
    return (
      <circle
        key={`inflow-dot-${payload.date}`}
        cx={cx}
        cy={cy}
        r={5.5}
        fill="#10b981"
        stroke="#042f2e"
        strokeWidth={2}
        className="transition-all hover:r-7 cursor-pointer"
      />
    );
  };

  // Custom Dot for OUTFLOW: renders red circle if point has outflow transactions
  const renderOutflowDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    if (!payload?.hasOutflow) {
      return <g key={`outflow-empty-${index}`} />;
    }
    return (
      <circle
        key={`outflow-dot-${payload.date}`}
        cx={cx}
        cy={cy}
        r={5.5}
        fill="#ef4444"
        stroke="#450a0a"
        strokeWidth={2}
        className="transition-all hover:r-7 cursor-pointer"
      />
    );
  };

  // Rich Tooltip with transaction details
  const CustomAnalyticsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: AnalyticsDataPoint = payload[0].payload;
      const txs = data.transactions || [];

      return (
        <div className="bg-surface-modal/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl p-4 shadow-2xl text-xs max-w-sm w-80">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
            <span className="font-bold text-white tracking-wide text-sm">
              {data.label}
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              {data.date}
            </span>
          </div>

          {/* Metric Summary */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="flex items-center gap-1.5 text-primary">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {viewMode === "cumulative" ? "Cum. Inflow:" : "Day Inflow:"}
              </span>
              <span className="font-mono font-bold text-white">
                {formatINR(
                  viewMode === "cumulative"
                    ? data.cumulativeInflow
                    : data.inflow
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {viewMode === "cumulative" ? "Cum. Outflow:" : "Day Outflow:"}
              </span>
              <span className="font-mono font-bold text-white">
                {formatINR(
                  viewMode === "cumulative"
                    ? data.cumulativeOutflow
                    : data.outflow
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-300 pt-1 border-t border-neutral-800/80">
              <span className="text-neutral-400">Net Flow:</span>
              <span
                className={`font-mono font-bold ${
                  data.netFlow >= 0 ? "text-primary" : "text-rose-400"
                }`}
              >
                {data.netFlow >= 0 ? "+" : ""}
                {formatINR(data.netFlow)}
              </span>
            </div>
          </div>

          {/* Transaction items list on this date */}
          {txs.length > 0 ? (
            <div className="pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Transactions ({txs.length})
                </span>
                <span className="text-[10px] text-neutral-500">
                  Click to inspect
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {txs.map((tx, idx) => (
                  <div
                    key={`${tx.id}-${idx}`}
                    className="p-2 rounded-xl bg-surface/80 border border-neutral-800 flex items-start justify-between gap-2 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            tx.type === "INFLOW"
                              ? "bg-primary/20 text-primary"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {tx.type === "INFLOW" ? "+" : "-"}
                        </span>
                        <p className="font-semibold text-white truncate">
                          {tx.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                        <span className="flex items-center gap-1 capitalize">
                          <Tag className="w-2.5 h-2.5 text-neutral-500" />
                          {tx.category}
                        </span>
                        {tx.houseName && (
                          <span className="flex items-center gap-1 truncate text-neutral-500">
                            • {tx.houseName}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`font-mono font-bold whitespace-nowrap text-xs ${
                        tx.type === "INFLOW" ? "text-primary" : "text-rose-400"
                      }`}
                    >
                      {tx.type === "INFLOW" ? "+" : "-"}
                      {formatINR(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-500 text-center">
              No direct transactions logged on this day
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const presets: AnalyticsDatePreset[] = ["3M", "6M", "1Y", "2Y", "3Y", "ALL"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl space-y-6"
    >
      {/* Top Header: Clean 2-Row Layout with Distinct Visual Hierarchy */}
      <div className="space-y-4">
        {/* Row 1: Context & Property Scope */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                Historical Cash Flow Analysis
              </h3>
              <p className="text-xs text-neutral-400">
                Comparative trajectory of inflows vs outflows with transaction
                event markers
              </p>
            </div>
          </div>

          {/* Property Selector Aligned to Top Right */}
          <div className="relative self-start sm:self-center">
            <select
              value={currentHouseId}
              onChange={handleHouseChange}
              className="appearance-none bg-surface hover:bg-surface-hover border border-neutral-700/80 text-neutral-200 text-xs font-semibold rounded-xl pl-9 pr-9 py-2 hover:border-neutral-500 focus:outline-none focus:border-primary transition-all cursor-pointer shadow-sm"
            >
              <option value="ALL">All Properties</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-primary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Row 2: Chart Mode & Range Toolbar (Balanced horizontal bar) */}
        <div className="pt-3 border-t border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: View Mode Segmented Control */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 hidden lg:inline">
              View Mode:
            </span>
            <div className="inline-flex items-center bg-surface border border-neutral-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setViewMode("cumulative")}
                title="Continuous Cumulative Curves"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "cumulative"
                    ? "bg-neutral-800 text-white font-bold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span>Cumulative</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("periodic")}
                title="Daily Flow Intervals"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "periodic"
                    ? "bg-neutral-800 text-white font-bold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Daily</span>
              </button>
            </div>
          </div>

          {/* Right: Timeframe Selector & Custom Date */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 hidden lg:inline">
              Timeframe:
            </span>

            {/* Preset Buttons */}
            <div className="inline-flex items-center bg-surface border border-neutral-800 rounded-xl p-1 gap-1">
              {presets.map((preset) => {
                const isActive = currentRange === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleRangeChange(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-black shadow-sm shadow-primary/20"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/80"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Popover Trigger */}
            <div className="relative" ref={customDateRef}>
              <button
                type="button"
                onClick={() => setIsCustomDateOpen(!isCustomDateOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  currentRange === "CUSTOM"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Custom Date</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {/* Custom Date Dropdown Popover */}
              {isCustomDateOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-surface-modal border border-neutral-700 rounded-2xl p-4 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-xs font-bold text-white">
                      Select Date Range
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomDateOpen(false)}
                      className="text-neutral-400 hover:text-white p-1 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full bg-surface border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full bg-surface border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomDateOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCustomDate}
                      className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-black rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Area Canvas */}
      <div className="w-full h-[460px] pt-4 select-none">
        {points.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400">
            <p className="text-sm font-medium text-neutral-300">
              No records found.
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Use &quot;+ Add Inflow&quot; or &quot;- Add Outflow&quot; above to
              start logging.
            </p>
          </div>
        ) : !isMounted ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-neutral-500 animate-pulse">
            Loading cash flow analytics chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={points}
              margin={{ top: 15, right: 20, left: 20, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#262626"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#262626" }}
                minTickGap={30}
                tickFormatter={(val: string) => {
                  if (typeof val === "string" && val.includes("/")) return val;
                  if (typeof val === "string" && val.includes("-")) {
                    const parts = val.split("-");
                    if (parts.length === 3) {
                      return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
                    }
                  }
                  return val;
                }}
              />

              <YAxis
                stroke="#737373"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#262626" }}
                tickFormatter={(v) => formatCompactINR(v)}
                width={70}
              />

              <Tooltip
                content={<CustomAnalyticsTooltip />}
                cursor={{
                  stroke: "#525252",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              {/* Inflow Area / Smooth Curve with Green Dots */}
              <Area
                type="natural"
                dataKey={inflowDataKey}
                name="Inflow"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorInflow)"
                dot={renderInflowDot}
                activeDot={{
                  r: 7,
                  fill: "#10b981",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />

              {/* Outflow Area / Smooth Curve with Red Dots */}
              <Area
                type="natural"
                dataKey={outflowDataKey}
                name="Outflow"
                stroke="#ef4444"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorOutflow)"
                dot={renderOutflowDot}
                activeDot={{
                  r: 7,
                  fill: "#ef4444",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Legend Bar (Matches bottom legend in reference screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-800 text-xs">
        {/* Legend Markers */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-primary" />
            <span className="text-neutral-300 font-medium">Inflow Trend</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-rose-500" />
            <span className="text-neutral-300 font-medium">Outflow Trend</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary border-2 border-[#042f2e]" />
            <span className="text-neutral-300 font-medium">
              Inflow Transaction
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-[#450a0a]" />
            <span className="text-neutral-300 font-medium">
              Outflow Transaction
            </span>
          </div>
        </div>

        {/* Data points count and range info */}
        <div className="text-neutral-400 font-mono text-[11px]">
          {summary.dataPointCount} data points ({summary.startDate} to{" "}
          {summary.endDate})
        </div>
      </div>
    </motion.div>
  );
}
