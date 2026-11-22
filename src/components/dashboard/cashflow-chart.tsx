"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Loader2 } from "lucide-react";
import { formatCompactINR, formatINR } from "@/lib/formatters";
import {
  CashflowChartProps,
  CashflowTimeframe,
  CashflowChartDataPoint,
} from "@/types/dashboard.types";
import { getCashflowTrendData } from "@/lib/actions/cashflow.actions";

export function CashflowChart({
  data: legacyData,
  initialData,
  currentHouseId = "ALL",
  initialTimeframe = "1Y",
}: CashflowChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTimeframe =
    (searchParams.get("timeframe") as CashflowTimeframe) || null;
  const startingTimeframe = urlTimeframe || initialTimeframe || "1Y";

  const [timeframe, setTimeframe] =
    useState<CashflowTimeframe>(startingTimeframe);
  const [chartData, setChartData] = useState<CashflowChartDataPoint[]>(
    initialData || legacyData || []
  );
  const [isPending, startTransition] = useTransition();

  // Synchronize when initialData or currentHouseId changes from parent
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setChartData(initialData);
    }
  }, [initialData]);

  // When timeframe or houseId changes, fetch the exact trend dataset
  const handleTimeframeChange = (tf: CashflowTimeframe) => {
    if (tf === timeframe && chartData.length > 0) return;
    setTimeframe(tf);

    // Update URL query parameter smoothly without page jump
    const params = new URLSearchParams(searchParams.toString());
    if (tf === "1Y") {
      params.delete("timeframe");
    } else {
      params.set("timeframe", tf);
    }
    const newQs = params.toString();
    const newUrl = newQs ? `${pathname}?${newQs}` : pathname;
    window.history.replaceState(null, "", newUrl);

    startTransition(async () => {
      try {
        const freshData = await getCashflowTrendData(tf, currentHouseId);
        setChartData(freshData);
      } catch (err) {
        console.error("Failed to fetch cashflow trend data:", err);
      }
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inflow = payload[0]?.value || 0;
      const outflow = payload[1]?.value || 0;
      const net = inflow - outflow;

      return (
        <div className="bg-surface border border-border-active rounded-xl p-3 shadow-xl text-xs min-w-[170px]">
          <p className="font-semibold text-neutral-300 mb-2 border-b border-border-subtle pb-1">
            {label}
          </p>
          <div className="space-y-1.5">
            <p className="text-primary flex items-center justify-between gap-4">
              <span>Inflow:</span>
              <span className="font-mono font-bold">{formatINR(inflow)}</span>
            </p>
            <p className="text-danger flex items-center justify-between gap-4">
              <span>Outflow:</span>
              <span className="font-mono font-bold">{formatINR(outflow)}</span>
            </p>
            <p className="flex items-center justify-between gap-4 pt-1 border-t border-border-subtle/60">
              <span className="text-neutral-400">Net Flow:</span>
              <span
                className={`font-mono font-bold ${
                  net >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {net >= 0 ? `+${formatINR(net)}` : formatINR(net)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasData = chartData && chartData.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      className="bg-card border border-border-subtle rounded-2xl p-6 shadow-lg relative"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white tracking-tight">
              Cash Inflow vs Outflow Trend
            </h4>
            {isPending && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-primary animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating...
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Monthly comparison of cash movements (
            {timeframe === "1Y"
              ? "last 12 months"
              : timeframe === "2Y"
                ? "last 24 months"
                : timeframe === "3Y"
                  ? "last 36 months"
                  : "all recorded history"}
            )
          </p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          {/* 1Y | 2Y | 3Y | ALL Filter Segment */}
          <div className="flex items-center bg-surface border border-border-subtle rounded-xl p-1 gap-1">
            {(["1Y", "2Y", "3Y", "ALL"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => handleTimeframeChange(tf)}
                disabled={isPending}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-primary text-black font-extrabold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                } ${isPending ? "opacity-70 cursor-wait" : ""}`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Inflow / Outflow Legend */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-neutral-300">Inflow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger" />
              <span className="text-neutral-300">Outflow</span>
            </div>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-neutral-400">
          <p className="text-sm font-semibold">
            No transaction timeline data recorded yet.
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Add inflows or outflows to generate chart trends.
          </p>
        </div>
      ) : (
        <div
          className={`h-64 w-full transition-opacity duration-200 ${
            isPending ? "opacity-60" : "opacity-100"
          }`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.0}
                  />
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-danger)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-danger)"
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-subtle)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "var(--border-subtle)" }}
                minTickGap={25}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompactINR(v)}
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInflow)"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stroke="var(--color-danger)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOutflow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
