"use client";

import { useState, useTransition, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Fuel,
  Car,
  Wrench,
  Sparkles,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Layers,
  Activity,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { formatINR, formatCompactINR } from "@/lib/formatters";
import { getItemSpendingCadenceAnalytics } from "@/lib/actions/analytics.actions";
import { CategoryOutflowIntelligence } from "@/components/analytics/category-outflow-intelligence";
import {
  SpendingCadenceSectionProps,
  SpendingCadenceAnalyticsResult,
} from "@/types/analytics.types";

const SUBTYPE_ICONS: Record<string, typeof Fuel> = {
  fuel: Fuel,
  service: Wrench,
  repair: AlertTriangle,
  care: Sparkles,
  insurance: ShieldAlert,
  general: Layers,
};

export function SpendingCadenceSection({
  initialAnalytics,
  availableItems,
  currentHouseId,
  initialItemKey = "black-kia",
}: SpendingCadenceSectionProps) {
  const [data, setData] =
    useState<SpendingCadenceAnalyticsResult>(initialAnalytics);
  const [selectedKey, setSelectedKey] = useState<string>(initialItemKey);
  const [, startTransition] = useTransition();

  // Sync state if initialAnalytics or initialItemKey from server changes
  useEffect(() => {
    setData(initialAnalytics);
    setSelectedKey(initialItemKey);
  }, [initialAnalytics, initialItemKey]);

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    startTransition(async () => {
      const res = await getItemSpendingCadenceAnalytics(key, currentHouseId);
      setData(res);
    });
  };

  const featuredItems = availableItems.filter((i) => i.isFeatured);
  const nonFeaturedCategories = availableItems.filter((i) => !i.isFeatured);

  return (
    <div className="space-y-6">
      {/* Top Banner & Integrated High-End Selection Dock */}
      <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
        {/* Subtle Ambient Glow Accents (Theme Matching) */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Section Header: Title & Live Analyzed Target */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-lg shadow-primary/10 shrink-0">
              <Activity className="w-6 h-6 stroke-[2.25]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Spending Cadence & Item Intelligence
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/25 uppercase tracking-wider">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Outflow cadence, refuel frequencies, decade clustering & True
                Cost of Ownership.
              </p>
            </div>
          </div>

          {/* Active Target Banner */}
          <div className="flex items-center gap-2.5 bg-surface border border-border-muted rounded-2xl px-3.5 py-2 shrink-0 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-xs text-neutral-400 font-medium">
              Target:
            </span>
            <span className="text-xs font-bold text-white tracking-tight">
              {data.queryLabel}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              {data.totalOccurrences} events
            </span>
            <span className="text-xs font-bold text-white font-mono">
              {formatCompactINR(data.totalSpent)}
            </span>
          </div>
        </div>

        {/* High-End Category & Vehicle Selector Dock */}
        <div className="relative z-10 bg-surface/90 border border-border-muted rounded-2xl p-3.5 space-y-3">
          {/* Subheader */}
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>
              Select Vehicle or Spending Category ({availableItems.length}{" "}
              Available)
            </span>
          </div>

          {/* Interactive Chips Strip: Vehicles + Outflow Categories */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {/* Featured Vehicles */}
            {featuredItems.map((item) => {
              const isSelected = selectedKey === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                    isSelected
                      ? "bg-primary text-black shadow-primary/25 border border-primary ring-2 ring-primary/20 scale-[1.02]"
                      : "bg-card hover:bg-surface-hover text-neutral-300 hover:text-white border border-border-muted hover:border-border-hover"
                  }`}
                >
                  {item.id === "black-kia" ? (
                    <Car className="w-3.5 h-3.5" />
                  ) : (
                    <Fuel className="w-3.5 h-3.5" />
                  )}
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isSelected
                        ? "bg-black/20 text-black font-black"
                        : "bg-surface text-neutral-400 border border-border-subtle"
                    }`}
                  >
                    {item.count}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected
                        ? "text-black/90 font-bold"
                        : "text-neutral-500"
                    }`}
                  >
                    {formatCompactINR(item.totalSpent)}
                  </span>
                </button>
              );
            })}

            {/* Subtle Divider */}
            {featuredItems.length > 0 && nonFeaturedCategories.length > 0 && (
              <div className="h-6 w-px bg-border-muted mx-1 hidden sm:block" />
            )}

            {/* Outflow Categories */}
            {nonFeaturedCategories.map((item) => {
              const isSelected = selectedKey === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                    isSelected
                      ? "bg-primary text-black font-black shadow-primary/25 border border-primary ring-2 ring-primary/20 scale-[1.02]"
                      : "bg-card hover:bg-surface-hover text-neutral-300 hover:text-white border border-border-muted hover:border-border-hover"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSelected ? "bg-black" : "bg-neutral-500"
                    }`}
                  />
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isSelected
                        ? "bg-black/20 text-black font-black"
                        : "bg-surface text-neutral-400 border border-border-subtle"
                    }`}
                  >
                    {item.count}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected
                        ? "text-black/90 font-bold"
                        : "text-neutral-500"
                    }`}
                  >
                    {formatCompactINR(item.totalSpent)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bento Grid: 4 Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outflow */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border-subtle rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-border-hover transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">
              Total Outflow Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white tracking-tight">
              {formatINR(data.totalSpent)}
            </p>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
              <span className="font-bold text-white">
                {data.totalOccurrences}
              </span>{" "}
              total occurrences
              <span>•</span>
              <span>Avg {formatINR(data.averageAmount)}/event</span>
            </p>
          </div>
        </motion.div>

        {/* Card 2: Average Cadence / Interval */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-card border border-border-subtle rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-border-hover transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">
              Refill / Event Cadence
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white tracking-tight">
              Every {data.averageIntervalDays} Days
            </p>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
              <span>Regularity Score:</span>
              <span className="font-bold text-teal-400">
                {data.regularityScore}%
              </span>
              <span>
                (Min {data.minIntervalDays}d • Max {data.maxIntervalDays}d)
              </span>
            </p>
          </div>
        </motion.div>

        {/* Card 3: Spend per Visit (Ticket Size) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-card border border-border-subtle rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-border-hover transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">
              Typical Ticket Size
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white tracking-tight">
              {formatINR(data.medianAmount)}
            </p>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
              <span>Range:</span>
              <span className="text-neutral-300 font-medium">
                {formatINR(data.minAmount)}
              </span>
              <span>to</span>
              <span className="text-neutral-300 font-medium">
                {formatINR(data.maxAmount)}
              </span>
            </p>
          </div>
        </motion.div>

        {/* Card 4: Next Predicted Occurrence */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-card border border-border-subtle rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-border-hover transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">
              Next Estimated Occurrence
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-black text-indigo-300 tracking-tight">
              {data.predictedNextOccurrenceDate
                ? data.predictedNextOccurrenceDate
                : "Cadence Active"}
            </p>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
              <span>Expected Outflow:</span>
              <span className="font-bold text-white">
                ~{formatINR(data.predictedNextAmount)}
              </span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Row 2: Deep Dive Visualizations (Interval Cadence & Sub-Item Decomposition) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Refueling Interval Histogram / Distribution */}
        <div className="lg:col-span-2 bg-card border border-border-subtle rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Occurrence Cadence & Interval Spread</span>
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Frequency distribution of days elapsed between consecutive
                spends
              </p>
            </div>
            <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-xl">
              Avg {data.averageIntervalDays} Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.intervalBuckets}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-surface-modal/95 backdrop-blur-md border border-neutral-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <p className="font-bold text-white">
                          Interval: {item.label}
                        </p>
                        <p className="text-teal-400 font-semibold">
                          {item.count} occurrences ({item.percentage}%)
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.intervalBuckets.map((entry, idx) => (
                    <Cell
                      key={`bucket-${idx}`}
                      fill={
                        entry.count ===
                        Math.max(...data.intervalBuckets.map((b) => b.count))
                          ? "#10b981"
                          : "#0284c7"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border-subtle/80 text-center">
            {data.dayOfMonthClusters.map((cluster) => (
              <div
                key={cluster.decade}
                className="bg-surface/50 rounded-xl p-2.5 border border-border-muted/50"
              >
                <p className="text-[10px] text-neutral-400 uppercase font-medium">
                  {cluster.decade}
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {cluster.count} spends
                </p>
                <p className="text-[11px] text-primary font-semibold mt-0.5">
                  {formatCompactINR(cluster.totalAmount)} ({cluster.percentage}
                  %)
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Sub-Item Decomposition / Total Cost of Ownership */}
        <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Expense Purpose Allocation
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Decomposition across fuel, maintenance & care
                </p>
              </div>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.subTypeBreakdown}
                    dataKey="totalAmount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.subTypeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="bg-surface-modal/95 backdrop-blur-md border border-neutral-700/80 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{item.label}</p>
                          <p
                            className="font-semibold"
                            style={{ color: item.color }}
                          >
                            {formatINR(item.totalAmount)} ({item.percentage}%)
                          </p>
                          <p className="text-neutral-400 text-[10px]">
                            {item.count} events
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subtype Legend Breakdown */}
          <div className="space-y-2 mt-4 pt-4 border-t border-border-subtle/80">
            {data.subTypeBreakdown.map((item) => {
              const Icon = SUBTYPE_ICONS[item.subType] || Layers;
              return (
                <div
                  key={item.subType}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <Icon className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-neutral-300 font-medium">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">
                      {formatINR(item.totalAmount)}
                    </span>
                    <span className="text-[10px] text-neutral-500 w-8 text-right font-medium">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Spend Run-Rate Trajectory */}
      <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Monthly Outflow Velocity & Run-Rate
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Historical monthly trajectory of capital spent on{" "}
              {data.queryLabel}
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.monthlyRunRates}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => formatCompactINR(v)}
              />
              <Tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-surface-modal/95 backdrop-blur-md border border-neutral-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                      <p className="font-bold text-white">{item.label}</p>
                      <p className="text-primary font-bold">
                        {formatINR(item.amount)}
                      </p>
                      <p className="text-neutral-400 text-[10px]">
                        {item.count} transaction(s)
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Outflow Intelligence Matrix (Placed directly below Spending Cadence) */}
      {data.extendedIntelligence && (
        <div className="pt-4 border-t border-border-subtle">
          <CategoryOutflowIntelligence
            data={data.extendedIntelligence}
            categoryLabel={data.queryLabel}
          />
        </div>
      )}
    </div>
  );
}
