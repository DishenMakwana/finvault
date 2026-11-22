"use client";

import React, { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCompactINR, formatINR } from "@/lib/formatters";
import { CashflowChartProps, CashflowTimeframe } from "@/types/dashboard.types";

export function CashflowChart({ data }: CashflowChartProps) {
  const [timeframe, setTimeframe] = useState<CashflowTimeframe>("1Y");

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeframe === "ALL") return data;
    const count = timeframe === "1Y" ? 12 : timeframe === "2Y" ? 24 : 36;
    return data.slice(-count);
  }, [data, timeframe]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border-subtle rounded-2xl p-6 h-80 flex flex-col items-center justify-center text-neutral-400">
        <p className="text-sm">No transaction timeline data recorded yet.</p>
        <p className="text-xs text-neutral-500 mt-1">
          Add inflows or outflows to generate chart trends.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border-active rounded-xl p-3 shadow-xl text-xs">
          <p className="font-semibold text-neutral-300 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-primary flex items-center justify-between gap-4">
              <span>Inflow:</span>
              <span className="font-mono font-bold">
                {formatINR(payload[0]?.value)}
              </span>
            </p>
            <p className="text-danger flex items-center justify-between gap-4">
              <span>Outflow:</span>
              <span className="font-mono font-bold">
                {formatINR(payload[1]?.value)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            Cash Inflow vs Outflow Trend
          </h4>
          <p className="text-xs text-neutral-400">
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
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-primary text-black font-extrabold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
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

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
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
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactINR(v)}
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
    </div>
  );
}
