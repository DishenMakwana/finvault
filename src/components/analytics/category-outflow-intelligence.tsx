"use client";

import { motion } from "framer-motion";
import {
  Flame,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  CheckCircle2,
  Zap,
  Sparkles,
} from "lucide-react";
import { formatINR, formatCompactINR } from "@/lib/formatters";
import { CategoryOutflowIntelligenceProps } from "@/types/analytics.types";

const DECADE_LABELS: Record<string, string> = {
  EARLY: "1st - 10th",
  MID: "11th - 20th",
  LATE: "21st - 31st",
};

const DECADE_DESCRIPTIONS: Record<string, string> = {
  EARLY: "Early Month (Salary/Bills Wave)",
  MID: "Mid Month (Operational Cadence)",
  LATE: "Late Month (Reconciliation)",
};

export function CategoryOutflowIntelligence({
  data,
  categoryLabel,
}: CategoryOutflowIntelligenceProps) {
  const {
    velocity,
    volatility,
    anomalies,
    pareto,
    temporalHeatmap,
    microBleed,
  } = data;

  // Velocity status badge helper
  const getVelocityBadge = (
    status: typeof velocity.status,
    mode: typeof velocity.mode
  ) => {
    if (mode === "CADENCE_ESTIMATED" || status === "CADENCE_ESTIMATED") {
      return {
        label: "Cadence Projected",
        className: "bg-primary/15 text-primary border-primary/30",
        icon: Sparkles,
      };
    }
    switch (status) {
      case "OVERHEATING":
        return {
          label: "Overheating Pace",
          className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          icon: Flame,
        };
      case "ACCELERATED":
        return {
          label: "Accelerated Burn",
          className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          icon: TrendingUp,
        };
      case "SLOW":
        return {
          label: "Subdued Outflow",
          className: "bg-cyan/15 text-cyan border-cyan/30",
          icon: ShieldCheck,
        };
      default:
        return {
          label: "Optimal Pacing",
          className: "bg-primary/15 text-primary border-primary/30",
          icon: CheckCircle2,
        };
    }
  };

  // Volatility badge helper
  const getVolatilityBadge = (
    classification: typeof volatility.classification
  ) => {
    switch (classification) {
      case "FIXED":
        return {
          label: "Rock Solid Fixed",
          desc: "Highly predictable recurring commitment with minimal variance.",
          className: "bg-primary/15 text-primary border-primary/30",
        };
      case "ELASTIC":
        return {
          label: "Elastic Discretionary",
          desc: "Semi-variable spend that scales flexibly with monthly activity.",
          className: "bg-cyan/15 text-cyan border-cyan/30",
        };
      case "WILDCARD":
        return {
          label: "Wildcard Spiky",
          desc: "High volatility with sharp occasional ticket jumps.",
          className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        };
    }
  };

  const vBadge = getVelocityBadge(velocity.status, velocity.mode);
  const VIcon = vBadge.icon;
  const volBadge = getVolatilityBadge(volatility.classification);

  // Group heatmap cells by decade for structured row rendering
  const earlyCells = temporalHeatmap.filter((c) => c.decade === "EARLY");
  const midCells = temporalHeatmap.filter((c) => c.decade === "MID");
  const lateCells = temporalHeatmap.filter((c) => c.decade === "LATE");

  const decadeRows = [
    {
      key: "EARLY",
      title: DECADE_LABELS.EARLY,
      desc: DECADE_DESCRIPTIONS.EARLY,
      cells: earlyCells,
    },
    {
      key: "MID",
      title: DECADE_LABELS.MID,
      desc: DECADE_DESCRIPTIONS.MID,
      cells: midCells,
    },
    {
      key: "LATE",
      title: DECADE_LABELS.LATE,
      desc: DECADE_DESCRIPTIONS.LATE,
      cells: lateCells,
    },
  ];

  // Helper for heatmap cell color intensity
  const getHeatCellClass = (intensity: number) => {
    switch (intensity) {
      case 4:
        return "bg-primary text-black font-black border border-primary shadow-sm shadow-primary/30";
      case 3:
        return "bg-primary/70 text-black font-bold border border-primary/80";
      case 2:
        return "bg-primary/40 text-emerald-300 border border-primary/50";
      case 1:
        return "bg-primary/20 text-emerald-400 border border-primary/30";
      default:
        return "bg-surface/60 text-neutral-600 border border-border-subtle";
    }
  };

  const driverColors = ["#00D084", "#06B6D4", "#6366F1", "#F59E0B"];

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
        {/* Subtle Ambient Accent */}
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-lg shadow-primary/10 shrink-0">
              <Zap className="w-6 h-6 stroke-[2.25]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Category Outflow Intelligence Matrix
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/25 uppercase tracking-wider">
                  Deep Insights
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Velocity burn pacing, volatility classification, Pareto
                concentration & anomaly triage for{" "}
                <span className="text-white font-semibold">
                  {categoryLabel}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface border border-border-muted rounded-xl px-3.5 py-2 shrink-0 self-start md:self-auto shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-xs text-neutral-400 font-medium">Scope:</span>
            <span className="text-xs font-bold text-white tracking-tight">
              {categoryLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid: 4 Core Intelligence Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Velocity & Burn Pacing */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border-subtle rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-border-hover transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Monthly Burn Velocity
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${vBadge.className}`}
              >
                <VIcon className="w-3 h-3" />
                {vBadge.label}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white tracking-tight font-mono">
                {formatINR(velocity.projectedMonthEndSpend)}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {velocity.mode === "CADENCE_ESTIMATED"
                  ? `Expected monthly burn (~${velocity.cadenceIntervalDays > 0 ? velocity.cadenceIntervalDays + "d" : "monthly"} cadence)`
                  : `Projected month-end spend (${velocity.daysElapsedInMonth}/${velocity.totalDaysInMonth} days)`}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle/80 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Daily Burn Rate:</span>
              <span className="font-mono font-bold text-white">
                ~{formatINR(velocity.currentDailyBurnRate)}/day
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>
                {velocity.mode === "CADENCE_ESTIMATED"
                  ? "Baseline Median:"
                  : "Baseline vs Projected:"}
              </span>
              <span
                className={`font-mono font-bold ${
                  velocity.mode === "CADENCE_ESTIMATED"
                    ? "text-neutral-300"
                    : velocity.velocityPacingPercentage > 15
                      ? "text-rose-400"
                      : velocity.velocityPacingPercentage > 0
                        ? "text-amber-400"
                        : "text-primary"
                }`}
              >
                {velocity.mode === "CADENCE_ESTIMATED"
                  ? `~${formatINR(velocity.baselineMonthlySpend)}/mo`
                  : `${velocity.velocityPacingPercentage >= 0 ? "+" : ""}${velocity.velocityPacingPercentage}%`}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Predictability & Volatility Classification */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-card border border-border-subtle rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-border-hover transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Predictability Profile
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${volBadge.className}`}
              >
                {volBadge.label}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white tracking-tight font-mono">
                {volatility.volatilityScore}
                <span className="text-xs text-neutral-500 font-normal">
                  {" "}
                  / 100
                </span>
              </p>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                {volBadge.desc}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle/80 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Baseline Buffer:</span>
              <span className="font-mono font-bold text-white">
                ~{formatINR(volatility.fixedBaselineAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Variance (CV):</span>
              <span className="font-mono font-bold text-neutral-300">
                {volatility.coefficientOfVariation}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Metric 3: Micro-Outflow Bleed (< ₹1,000) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-card border border-border-subtle rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-border-hover transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Micro-Outflow Bleed
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                &le; ₹1,000 Spends
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white tracking-tight font-mono">
                {formatINR(microBleed.totalBleedAmount)}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {microBleed.totalBleedCount} small txs (
                {microBleed.percentageOfCategoryTotal}% of total spend)
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle/80 space-y-1 text-[11px]">
            {microBleed.topMicroTitles.length > 0 ? (
              microBleed.topMicroTitles.slice(0, 2).map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-neutral-400"
                >
                  <span className="truncate max-w-[130px]">• {t.title}</span>
                  <span className="font-mono text-neutral-300">
                    {t.count}x ({formatCompactINR(t.total)})
                  </span>
                </div>
              ))
            ) : (
              <span className="text-neutral-500 text-[10px]">
                No micro-transactions under ₹1,000
              </span>
            )}
          </div>
        </motion.div>

        {/* Metric 4: Pareto 80/20 Concentration */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-card border border-border-subtle rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-border-hover transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                Pareto Concentration
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                80/20 Rule
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white tracking-tight font-mono">
                {pareto.top20PercentSpendShare}%
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Share of outflow consumed by the top 20% largest purchases
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle/80 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Top Drivers:</span>
              <span className="font-mono font-bold text-white">
                {pareto.topDrivers.length} main payees
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Tail Spend Share:</span>
              <span className="font-mono font-bold text-neutral-300">
                {pareto.tailSpendPercentage}% ({pareto.tailSpendCount} txs)
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 2: Temporal Heatmap & Pareto Spend Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap Matrix: Day of Week x Decade */}
        <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Calendar Rhythm & Outflow Timing Heatmap</span>
              </h4>
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                7 Days &times; 3 Decades
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Intensity of cash drain mapped across days of the week and monthly
              decade phases.
            </p>
          </div>

          {/* Heatmap Grid */}
          <div className="space-y-2.5">
            {/* Header: Weekdays */}
            <div className="grid grid-cols-8 gap-1.5 text-center text-[11px] font-bold text-neutral-400">
              <span className="text-left text-[10px] uppercase font-semibold text-neutral-500">
                Decade
              </span>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            {/* Rows */}
            {decadeRows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-8 gap-1.5 items-center"
              >
                <div
                  className="text-[10px] font-mono text-neutral-400 truncate pr-1"
                  title={row.desc}
                >
                  {row.title}
                </div>
                {row.cells.map((cell) => (
                  <div
                    key={`${cell.dayOfWeek}-${cell.decade}`}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center text-[10px] transition-all cursor-default group relative ${getHeatCellClass(
                      cell.intensity
                    )}`}
                  >
                    {cell.amount > 0 ? (
                      <>
                        <span className="font-mono leading-none">
                          {formatCompactINR(cell.amount)}
                        </span>
                        <span className="text-[8px] opacity-75 font-mono">
                          {cell.count} tx
                        </span>
                      </>
                    ) : (
                      <span className="opacity-20 text-[9px]">&mdash;</span>
                    )}

                    {/* Hover Tooltip */}
                    {cell.amount > 0 && (
                      <div className="absolute bottom-full mb-1.5 hidden group-hover:block z-30 pointer-events-none">
                        <div className="bg-surface-modal/95 backdrop-blur-md border border-neutral-700/80 p-2 rounded-xl shadow-2xl text-[10px] whitespace-nowrap text-left space-y-0.5">
                          <p className="font-bold text-white">
                            {cell.dayName} ({DECADE_LABELS[cell.decade]})
                          </p>
                          <p className="text-primary font-bold">
                            {formatINR(cell.amount)}
                          </p>
                          <p className="text-neutral-400">
                            {cell.count} transactions
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[10px] text-neutral-400">
            <span>Outflow Concentration</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <span className="w-3 h-3 rounded-md bg-surface border border-border-subtle" />
              <span className="w-3 h-3 rounded-md bg-primary/20 border border-primary/30" />
              <span className="w-3 h-3 rounded-md bg-primary/40 border border-primary/50" />
              <span className="w-3 h-3 rounded-md bg-primary/70 border border-primary/80" />
              <span className="w-3 h-3 rounded-md bg-primary border border-primary" />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Pareto Driver Breakdown */}
        <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan" />
                <span>Top Outflow Drivers (Pareto Breakdown)</span>
              </h4>
              <span className="text-[10px] font-bold text-cyan bg-cyan/10 border border-cyan/20 px-2 py-0.5 rounded-md">
                Cumulative Drivers
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Primary transaction titles dominating category cash drain vs
              long-tail spends.
            </p>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="space-y-1.5">
            <div className="h-4 w-full rounded-xl overflow-hidden flex bg-surface border border-border-subtle p-0.5">
              {pareto.topDrivers.map((driver, idx) => (
                <div
                  key={idx}
                  style={{
                    width: `${driver.percentage}%`,
                    backgroundColor: driverColors[idx % driverColors.length],
                  }}
                  className="h-full first:rounded-l-lg last:rounded-r-lg transition-all"
                  title={`${driver.name}: ${driver.percentage}%`}
                />
              ))}
              {pareto.tailSpendPercentage > 0 && (
                <div
                  style={{ width: `${pareto.tailSpendPercentage}%` }}
                  className="h-full bg-neutral-700/60 rounded-r-lg transition-all"
                  title={`Tail Spends: ${pareto.tailSpendPercentage}%`}
                />
              )}
            </div>
          </div>

          {/* Drivers List */}
          <div className="space-y-2.5">
            {pareto.topDrivers.map((driver, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface/70 border border-border-subtle text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: driverColors[idx % driverColors.length],
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">
                      {driver.name}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {driver.transactionCount} transactions •{" "}
                      {driver.percentage}% of category
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <p className="font-bold text-white">
                    {formatINR(driver.amount)}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-bold">
                    Cum: {driver.cumulativePercentage}%
                  </p>
                </div>
              </div>
            ))}

            {pareto.tailSpendCount > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface/30 border border-dashed border-border-subtle text-xs text-neutral-400">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-600 shrink-0" />
                  <span>Other Tail Spends ({pareto.tailSpendCount} txs)</span>
                </div>
                <span className="font-mono font-semibold text-neutral-300">
                  {formatINR(pareto.tailSpendTotal)} (
                  {pareto.tailSpendPercentage}%)
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border-subtle text-[10px] text-neutral-400 flex items-center justify-between">
            <span>Pareto Concentration Ratio</span>
            <span className="font-bold text-white">
              {pareto.topDrivers.length} titles drive{" "}
              {100 - pareto.tailSpendPercentage}% of total cash drain
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Statistical Outliers & Anomaly Triage */}
      <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Statistical Outliers & Spike Anomaly Triage
              </h4>
              <p className="text-xs text-neutral-400">
                Transactions with standard score Z &ge; 1.75 or exceeding
                2.2&times; category median ticket size.
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
              anomalies.length > 0
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-primary/15 text-primary border-primary/30"
            }`}
          >
            {anomalies.length > 0
              ? `${anomalies.length} Spikes Flagged`
              : "Zero Spikes"}
          </span>
        </div>

        {anomalies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className="p-3.5 rounded-xl bg-surface border border-amber-500/30 hover:border-amber-500/50 transition-all space-y-2 relative overflow-hidden shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-xs truncate">
                      {anom.title}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      {anom.date}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold font-mono shrink-0">
                    {anom.multiplierVsMedian}&times; Median
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-border-subtle">
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Z-Score: +{anom.zScore}
                  </span>
                  <span className="text-sm font-black font-mono text-white">
                    {formatINR(anom.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface/60 border border-border-muted flex items-center gap-3 text-xs text-neutral-400">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <span>
              All outflows for{" "}
              <strong className="text-white">{categoryLabel}</strong> are within
              normal variance. No statistical spikes detected.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
