"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  HeartHandshake,
  Sparkles,
  Flame,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  Sun,
  Coins,
} from "lucide-react";
import { formatINR, formatCompactINR } from "@/lib/formatters";
import {
  SpiritualGivingSectionProps,
  MonthlyGivingTrajectory,
} from "@/types/analytics.types";

export function SpiritualGivingSection({ data }: SpiritualGivingSectionProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTrajectoryView, setSelectedTrajectoryView] = useState<
    "ALL" | "BHOG" | "DONATION"
  >("ALL");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    totalSpiritualOutflow,
    totalEventsCount,
    givingRatioOfOutflow,
    givingRatioOfInflow,
    bhogTotal,
    bhogCount,
    bhogPercentage,
    donationTotal,
    donationCount,
    donationPercentage,
    averageDonationTicket,
    medianTicketSize,
    activeGivingStreakMonths,
    festiveOutflowTotal,
    festiveOutflowPercentage,
    monthlyTrajectory,
    shubhDenominations,
    purposeBreakdown,
    recentGivingEvents,
  } = data;

  if (totalEventsCount === 0) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D0D0D]/90 p-8 text-center backdrop-blur-xl">
        <HeartHandshake className="mx-auto h-12 w-12 text-amber-500/40" />
        <h3 className="mt-4 text-lg font-medium text-white">
          No Spiritual Giving Data Found
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No transactions found under Bhog or Donation categories for the
          selected property scope.
        </p>
      </section>
    );
  }

  // Calculate auspicious denomination share
  const totalShubhAmount = shubhDenominations.reduce(
    (sum, item) => sum + item.total,
    0
  );
  const shubhSharePercentage =
    totalSpiritualOutflow > 0
      ? Math.round((totalShubhAmount / totalSpiritualOutflow) * 100)
      : 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 sm:p-8 space-y-8 backdrop-blur-xl shadow-2xl">
      {/* Background Sacred Glows */}
      <div className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-amber-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-[140px]" />

      {/* Header Dock */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Spiritual Giving & Philanthropic Stewardship
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
              <Sparkles className="h-3 w-3" />
              Dharma & Philanthropy
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-400">
              {totalEventsCount} Sacred Offerings
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
            Dedicated intelligence on sacred offerings (Bhog) and charitable
            contributions (Daan), auspicious denomination cadence, and seva
            purpose allocations.
          </p>
        </div>

        {/* Stewardship Benchmark Badge */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3 text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Generous Stewardship</span>
            </div>
            <p className="mt-0.5 text-xs text-neutral-400">
              <span className="font-mono font-bold text-white">
                {givingRatioOfOutflow}%
              </span>{" "}
              of Total Outflow{" "}
              <span className="text-neutral-500 font-mono">
                ({givingRatioOfInflow}% Inflow)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Top 4 Bento KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Sacred Outflow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121212]/90 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Total Sacred Outflow
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {formatINR(totalSpiritualOutflow)}
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {totalEventsCount} lifetime events • Avg{" "}
              <span className="font-mono text-neutral-300">
                {formatINR(averageDonationTicket)}
              </span>
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Median Ticket:</span>
            <span className="font-mono text-neutral-200">
              {formatINR(medianTicketSize)}
            </span>
          </div>
        </motion.div>

        {/* Card 2: Bhog vs Donation Split */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121212]/90 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Bhog vs. Donation Split
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Bhog {bhogPercentage}%
              </span>
              <span className="text-xs text-indigo-400 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Donation {donationPercentage}%
              </span>
            </div>
            {/* Split Progress Bar */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-900 border border-white/10 flex">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                style={{ width: `${bhogPercentage}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                style={{ width: `${donationPercentage}%` }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="font-mono text-amber-300">
              {formatCompactINR(bhogTotal)}{" "}
              <span className="text-neutral-500 font-sans">
                ({bhogCount} txs)
              </span>
            </span>
            <span className="font-mono text-indigo-300">
              {formatCompactINR(donationTotal)}{" "}
              <span className="text-neutral-500 font-sans">
                ({donationCount} txs)
              </span>
            </span>
          </div>
        </motion.div>

        {/* Card 3: Active Giving Consistency Streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121212]/90 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Active Giving Streak
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-baseline gap-2">
              <span>{activeGivingStreakMonths}</span>
              <span className="text-sm font-sans font-medium text-neutral-400">
                Consecutive Months
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Unbroken record of monthly sacred contributions
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Consistency Index:</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <Sparkles className="h-3 w-3" /> High Regularity
            </span>
          </div>
        </motion.div>

        {/* Card 4: Auspicious Denominations (Shubh Share) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121212]/90 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Auspicious Shubh Share
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sun className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 tracking-tight">
              {shubhSharePercentage}%
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Traditional ₹1,11,111 / ₹11,000 / ₹5,100 / ₹1,100 / ₹501
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Festive Outflow:</span>
            <span className="font-mono text-amber-400">
              {festiveOutflowPercentage}%{" "}
              <span className="text-neutral-500 font-sans">
                ({formatCompactINR(festiveOutflowTotal)})
              </span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* Middle Row: Dual Deep Dive Visuals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols): Dual Monthly Trajectory Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-[#121212]/90 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="truncate">Monthly Giving Trajectory</span>
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm">
                Comparative timeline of Bhog offerings vs. Philanthropic
                donations
              </p>
            </div>

            {/* Segmented Filter Control */}
            <div className="shrink-0 self-start sm:self-auto inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-[#0E0E10] p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setSelectedTrajectoryView("ALL")}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedTrajectoryView === "ALL"
                    ? "bg-[#252528] text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Combined
              </button>

              <button
                type="button"
                onClick={() => setSelectedTrajectoryView("BHOG")}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedTrajectoryView === "BHOG"
                    ? "bg-[#252528] text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Bhog Only
              </button>

              <button
                type="button"
                onClick={() => setSelectedTrajectoryView("DONATION")}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedTrajectoryView === "DONATION"
                    ? "bg-[#252528] text-white shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Donation Only
              </button>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-[280px] w-full pt-2">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrajectory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="bhogGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#F59E0B"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="donationGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#818CF8" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#818CF8"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="totalGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#10B981"
                        stopOpacity={0.0}
                      />
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
                  />
                  <YAxis
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#262626" }}
                    tickFormatter={(v) => formatCompactINR(v)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload as MonthlyGivingTrajectory;
                      return (
                        <div className="rounded-xl border border-white/10 bg-[#141414] p-3 shadow-2xl backdrop-blur-md">
                          <p className="text-xs font-semibold text-white border-b border-white/10 pb-1.5 mb-2">
                            {d.label} • {d.eventCount} Contributions
                          </p>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-4 text-amber-400">
                              <span>Bhog (Sacred Food):</span>
                              <span className="font-mono font-semibold">
                                {formatINR(d.bhogAmount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-indigo-400">
                              <span>Donation (Philanthropy):</span>
                              <span className="font-mono font-semibold">
                                {formatINR(d.donationAmount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-emerald-400 font-semibold border-t border-white/10 pt-1 mt-1">
                              <span>Monthly Total:</span>
                              <span className="font-mono">
                                {formatINR(d.totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {(selectedTrajectoryView === "ALL" ||
                    selectedTrajectoryView === "BHOG") && (
                    <Area
                      type="monotone"
                      dataKey="bhogAmount"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#bhogGradient)"
                      name="Bhog"
                    />
                  )}
                  {(selectedTrajectoryView === "ALL" ||
                    selectedTrajectoryView === "DONATION") && (
                    <Area
                      type="monotone"
                      dataKey="donationAmount"
                      stroke="#818CF8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#donationGradient)"
                      name="Donation"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Seva & Giving Purpose Allocation */}
        <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#121212]/90 p-5 sm:p-6 space-y-4">
          <div className="border-b border-white/[0.06] pb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-400" />
              Seva Purpose Allocation
            </h3>
            <p className="text-xs text-neutral-400">
              Granular breakdown across spiritual worship, feeding, and
              community care
            </p>
          </div>

          {/* Purpose Ranked List */}
          <div className="space-y-3 pt-1">
            {purposeBreakdown.map((p) => (
              <div
                key={p.purpose}
                className="group rounded-xl border border-white/[0.05] bg-black/30 p-3 hover:border-white/[0.12] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-medium text-white">{p.label}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-200">
                    {formatINR(p.amount)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${p.percentage}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>
                    {p.count} contribution{p.count > 1 ? "s" : ""}
                  </span>
                  <span className="font-mono">{p.percentage}% of giving</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Shubh Denominations Pill Strip & Recent Offerings Ledger */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-400" />
              Shubh Auspicious Denominations Breakdown
            </h3>
            <p className="text-xs text-neutral-400">
              Classification of sacred offerings into traditional Vedic and
              philanthropic tiers
            </p>
          </div>
          <span className="text-xs text-neutral-400">
            Total Shubh Volume:{" "}
            <span className="font-mono font-semibold text-amber-300">
              {formatINR(totalShubhAmount)}
            </span>
          </span>
        </div>

        {/* Shubh Pills Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shubhDenominations.map((shubh) => (
            <div
              key={shubh.label}
              className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 text-center space-y-1 hover:border-amber-500/40 transition-colors"
            >
              <div className="text-[11px] font-medium text-neutral-300 truncate">
                {shubh.label}
              </div>
              <div className="text-sm font-mono font-bold text-amber-300">
                {formatCompactINR(shubh.total)}
              </div>
              <div className="text-[10px] text-neutral-400">
                {shubh.count} tx{shubh.count > 1 ? "s" : ""} •{" "}
                <span className="font-mono">{shubh.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Recent Sacred Contributions Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-rose-400" />
              Recent Sacred Offerings & Philanthropic Ledger
            </h3>
            <p className="text-xs text-neutral-400">
              Latest contributions with category verification and auspicious
              indicators
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentGivingEvents.map((event) => {
            const isBhog = event.category.toLowerCase().includes("bhog");
            return (
              <div
                key={event.id}
                className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212]/80 p-4 hover:border-white/[0.15] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 max-w-[70%]">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-amber-300 transition-colors">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                      <span>{event.date}</span>
                      <span>•</span>
                      <span
                        className={`font-medium ${
                          isBhog ? "text-amber-400" : "text-indigo-400"
                        }`}
                      >
                        {isBhog ? "Bhog" : "Donation"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-mono text-sm font-bold text-white">
                      {formatINR(event.amount)}
                    </span>
                    {event.isShubh && (
                      <div>
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-medium text-amber-400">
                          <Sparkles className="h-2.5 w-2.5" />
                          Shubh
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
