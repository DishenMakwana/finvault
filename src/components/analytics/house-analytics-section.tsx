"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  LabelList,
} from "recharts";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3,
  Coins,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  HouseAnalyticsSectionProps,
  HouseAnalyticsItem,
  HouseMetricView,
} from "@/types/analytics.types";
import { formatCompactINR, formatINR } from "@/lib/formatters";

export function HouseAnalyticsSection({ data }: HouseAnalyticsSectionProps) {
  const [metricView, setMetricView] = useState<HouseMetricView>("CASH_IN_HAND");
  const [activePropertyId, setActivePropertyId] = useState<number | "ALL">(
    "ALL"
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    houses,
    totalHouses,
    totalPortfolioCash,
    totalPortfolioInflow,
    totalPortfolioOutflow,
    netPortfolioFlow,
  } = data;

  // Filtered or highlighted houses
  const displayHouses = useMemo(() => {
    if (activePropertyId === "ALL") return houses;
    return houses.filter((h) => h.id === activePropertyId);
  }, [houses, activePropertyId]);

  // Sanitized chart dataset ensuring clean numeric types
  const chartData = useMemo(() => {
    return displayHouses.map((h) => ({
      ...h,
      totalInflow: Number(h.totalInflow) || 0,
      totalOutflow: Number(h.totalOutflow) || 0,
      netCashFlow: Number(h.netCashFlow) || 0,
      currentCashInHand: Number(h.currentCashInHand) || 0,
    }));
  }, [displayHouses]);

  // Dynamic resilient Y-Axis domain for Recharts
  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 100000];
    if (metricView === "CASHFLOW") {
      const maxVal = Math.max(
        ...chartData.map((h) => Math.max(h.totalInflow, h.totalOutflow, 0)),
        1000
      );
      return [0, Math.ceil(maxVal * 1.15)];
    }
    if (metricView === "CASH_IN_HAND") {
      const maxVal = Math.max(
        ...chartData.map((h) => Math.max(h.currentCashInHand, 0)),
        1000
      );
      return [0, Math.ceil(maxVal * 1.15)];
    }
    // NET
    const values = chartData.map((h) => h.netCashFlow);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 0);
    const pad = Math.max(Math.abs(maxVal - minVal) * 0.15, 1000);
    return [Math.floor(minVal - pad), Math.ceil(maxVal + pad)];
  }, [chartData, metricView]);

  // Donut chart dataset (Portfolio Allocation by total flow or net cash)
  const donutData = useMemo(() => {
    return houses.map((h) => ({
      name: h.name,
      value: h.totalInflow + h.totalOutflow || 1,
      color: h.color,
      share: h.totalFlowShare,
      inflow: h.totalInflow,
      outflow: h.totalOutflow,
      cashInHand: h.currentCashInHand,
    }));
  }, [houses]);

  if (!houses || houses.length === 0) {
    return (
      <div className="bg-card border border-border-subtle rounded-2xl p-6 text-center text-neutral-400">
        <Building2 className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
        <p className="text-sm font-semibold">No property records available.</p>
        <p className="text-xs text-neutral-500 mt-1">
          Add properties and record cash inflows or outflows to generate house
          analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Bar with Dribbble-style segmented controls */}
      <div className="bg-card border border-border-subtle rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Property & House Financial Intelligence</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-pill border border-border-active text-neutral-400">
                    {totalHouses}{" "}
                    {totalHouses === 1 ? "Property" : "Properties"}
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Multi-property comparative cashflow, portfolio asset
                  allocation & yield performance
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Metric Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center p-1 rounded-xl bg-surface border border-neutral-800 text-xs gap-1">
              <button
                type="button"
                onClick={() => setMetricView("CASH_IN_HAND")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  metricView === "CASH_IN_HAND"
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                    : "text-neutral-400 hover:text-white border border-transparent"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Cash in Hand</span>
              </button>

              <button
                type="button"
                onClick={() => setMetricView("CASHFLOW")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  metricView === "CASHFLOW"
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                    : "text-neutral-400 hover:text-white border border-transparent"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Cash Flow (In / Out)</span>
              </button>

              <button
                type="button"
                onClick={() => setMetricView("NET")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  metricView === "NET"
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                    : "text-neutral-400 hover:text-white border border-transparent"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Net Cash Position</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bento Charts Grid (Comparative Bar Chart + Donut Allocation) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Module A: Multi-Property Grouped Bar Chart (7 cols on lg) */}
        <div className="lg:col-span-7 bg-card border border-border-subtle rounded-2xl p-5 shadow-xl flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-white tracking-tight">
                  {metricView === "CASHFLOW"
                    ? "Inflow vs Outflow Comparison"
                    : metricView === "NET"
                      ? "Net Operating Margin by Property"
                      : "Effective Cash in Hand by Property"}
                </h4>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                {metricView === "CASHFLOW" ? (
                  <>
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                      Inflows
                    </span>
                    <span className="flex items-center gap-1.5 text-danger">
                      <span className="w-2.5 h-2.5 rounded-sm bg-danger" />
                      Outflows
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-cyan">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan" />
                    {metricView === "NET" ? "Net Cash Flow" : "Cash in Hand"}
                  </span>
                )}
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-[320px] w-full min-w-0 select-none">
              {!isMounted ? (
                <div className="h-full w-full flex items-center justify-center text-xs text-neutral-500 animate-pulse">
                  Loading comparison chart...
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={100}
                  minHeight={280}
                >
                  <BarChart
                    key={`${metricView}-${activePropertyId}`}
                    data={chartData}
                    margin={{ top: 25, right: 15, left: 10, bottom: 20 }}
                    barGap={8}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff10"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#ffffff40"
                      tick={{ fill: "#ffffff80", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#ffffff20" }}
                      interval={0}
                    />
                    <YAxis
                      stroke="#ffffff40"
                      width={65}
                      tick={{
                        fill: "#ffffff80",
                        fontSize: 10,
                        fontFamily: "monospace",
                      }}
                      tickFormatter={(v) => formatCompactINR(v)}
                      tickLine={false}
                      axisLine={{ stroke: "#ffffff20" }}
                      domain={yDomain}
                    />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const item = payload[0].payload as HouseAnalyticsItem;
                        return (
                          <div className="bg-neutral-950/95 border border-neutral-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[200px] text-xs space-y-1.5">
                            <p className="font-bold text-white border-b border-neutral-800 pb-1 flex items-center justify-between">
                              <span>{item.name}</span>
                              <span className="text-[10px] text-neutral-400">
                                ID #{item.id}
                              </span>
                            </p>
                            <div className="flex justify-between text-neutral-300">
                              <span className="text-neutral-400">
                                Total Inflow:
                              </span>
                              <span className="font-mono text-primary font-bold">
                                +{formatINR(item.totalInflow)}
                              </span>
                            </div>
                            <div className="flex justify-between text-neutral-300">
                              <span className="text-neutral-400">
                                Total Outflow:
                              </span>
                              <span className="font-mono text-danger font-bold">
                                -{formatINR(item.totalOutflow)}
                              </span>
                            </div>
                            <div className="flex justify-between text-neutral-300 border-t border-neutral-800/80 pt-1">
                              <span className="text-neutral-400">
                                Net Flow:
                              </span>
                              <span
                                className={`font-mono font-bold ${
                                  item.netCashFlow >= 0
                                    ? "text-primary"
                                    : "text-danger"
                                }`}
                              >
                                {item.netCashFlow >= 0 ? "+" : ""}
                                {formatINR(item.netCashFlow)}
                              </span>
                            </div>
                            {item.outstandingLoans > 0 && (
                              <div className="flex justify-between text-neutral-300">
                                <span className="text-neutral-400">
                                  Relative Loans Due:
                                </span>
                                <span className="font-mono text-rose-400 font-bold">
                                  -{formatINR(item.outstandingLoans)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-neutral-300">
                              <span className="text-neutral-400">
                                Cash in Hand:
                              </span>
                              <span className="font-mono text-cyan font-bold">
                                {formatINR(item.currentCashInHand)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    {/* CASHFLOW: Inflows Bar */}
                    {metricView === "CASHFLOW" && (
                      <Bar
                        dataKey="totalInflow"
                        name="Inflows"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        barSize={34}
                        minPointSize={6}
                        isAnimationActive={false}
                      >
                        <LabelList
                          dataKey="totalInflow"
                          position="top"
                          formatter={(val: unknown) =>
                            Number(val) > 0
                              ? `+${formatCompactINR(Number(val))}`
                              : ""
                          }
                          fill="#10b981"
                          fontSize={10}
                          fontFamily="monospace"
                          fontWeight={600}
                        />
                      </Bar>
                    )}

                    {/* CASHFLOW: Outflows Bar */}
                    {metricView === "CASHFLOW" && (
                      <Bar
                        dataKey="totalOutflow"
                        name="Outflows"
                        fill="#f43f5e"
                        radius={[6, 6, 0, 0]}
                        barSize={34}
                        minPointSize={6}
                        isAnimationActive={false}
                      >
                        <LabelList
                          dataKey="totalOutflow"
                          position="top"
                          formatter={(val: unknown) =>
                            Number(val) > 0
                              ? `-${formatCompactINR(Number(val))}`
                              : ""
                          }
                          fill="#f43f5e"
                          fontSize={10}
                          fontFamily="monospace"
                          fontWeight={600}
                        />
                      </Bar>
                    )}

                    {/* NET: Net Flow Bar */}
                    {metricView === "NET" && (
                      <Bar
                        dataKey="netCashFlow"
                        name="Net Flow"
                        radius={[6, 6, 0, 0]}
                        barSize={40}
                        minPointSize={6}
                        isAnimationActive={false}
                      >
                        <LabelList
                          dataKey="netCashFlow"
                          position="top"
                          formatter={(val: unknown) =>
                            Number(val) !== 0
                              ? `${Number(val) > 0 ? "+" : ""}${formatCompactINR(Number(val))}`
                              : "₹0"
                          }
                          fill="#ffffff"
                          fontSize={10}
                          fontFamily="monospace"
                          fontWeight={600}
                        />
                        {displayHouses.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.netCashFlow >= 0 ? "#10b981" : "#f43f5e"
                            }
                          />
                        ))}
                      </Bar>
                    )}

                    {/* CASH_IN_HAND: Cash in Hand Bar */}
                    {metricView === "CASH_IN_HAND" && (
                      <Bar
                        dataKey="currentCashInHand"
                        name="Cash in Hand"
                        fill="#06b6d4"
                        radius={[6, 6, 0, 0]}
                        barSize={40}
                        minPointSize={6}
                        isAnimationActive={false}
                      >
                        <LabelList
                          dataKey="currentCashInHand"
                          position="top"
                          formatter={(val: unknown) =>
                            Number(val) > 0
                              ? formatCompactINR(Number(val))
                              : "₹0"
                          }
                          fill="#06b6d4"
                          fontSize={10}
                          fontFamily="monospace"
                          fontWeight={600}
                        />
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quick Summary Strip */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle mt-2 text-center">
            <div className="bg-surface/50 rounded-lg p-2">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Portfolio Inflow
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                +{formatCompactINR(totalPortfolioInflow)}
              </span>
            </div>
            <div className="bg-surface/50 rounded-lg p-2">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Portfolio Outflow
              </span>
              <span className="text-xs font-mono font-bold text-danger">
                -{formatCompactINR(totalPortfolioOutflow)}
              </span>
            </div>
            <div className="bg-surface/50 rounded-lg p-2">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Net Portfolio Flow
              </span>
              <span
                className={`text-xs font-mono font-bold ${netPortfolioFlow >= 0 ? "text-primary" : "text-danger"}`}
              >
                {netPortfolioFlow >= 0 ? "+" : ""}
                {formatCompactINR(netPortfolioFlow)}
              </span>
            </div>
          </div>
        </div>

        {/* Module B: Portfolio Allocation Donut Chart (5 cols on lg) */}
        <div className="lg:col-span-5 bg-card border border-border-subtle rounded-2xl p-5 shadow-xl flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan" />
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Portfolio Asset Allocation
                </h4>
              </div>
              <span className="text-[10px] uppercase font-mono bg-cyan/10 text-cyan border border-cyan/20 px-2 py-0.5 rounded">
                Share of Flow
              </span>
            </div>

            {/* Donut Chart with Center Metric */}
            <div className="relative h-[210px] w-full min-w-0 flex items-center justify-center">
              {!isMounted ? (
                <div className="h-full w-full flex items-center justify-center text-xs text-neutral-500 animate-pulse">
                  Loading allocation...
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={100}
                  minHeight={200}
                >
                  <PieChart>
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="bg-neutral-950/95 border border-neutral-700/80 rounded-xl p-2.5 shadow-xl backdrop-blur-md text-xs">
                            <p className="font-bold text-white mb-1">
                              {item.name}
                            </p>
                            <div className="flex justify-between gap-3 text-neutral-300">
                              <span className="text-neutral-400">Share:</span>
                              <span className="font-mono text-cyan font-bold">
                                {item.share}%
                              </span>
                            </div>
                            <div className="flex justify-between gap-3 text-neutral-300">
                              <span className="text-neutral-400">
                                Total Volume:
                              </span>
                              <span className="font-mono text-white font-bold">
                                {formatINR(item.value)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={`donut-${index}`}
                          fill={entry.color}
                          stroke="#121620"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                  Portfolio
                </span>
                <span className="text-sm font-bold font-mono text-white">
                  {formatCompactINR(totalPortfolioCash)}
                </span>
                <span className="text-[9px] text-primary font-bold">
                  Cash in Hand
                </span>
                {data.totalPortfolioLoans > 0 && (
                  <span className="text-[8px] text-neutral-400 font-mono">
                    excl. {formatCompactINR(data.totalPortfolioLoans)} loans
                  </span>
                )}
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-1.5 mt-2">
              {houses.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface/60 border border-border-muted hover:border-border-contrast transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: h.color }}
                    />
                    <span className="font-semibold text-white">{h.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-neutral-300">
                      {formatCompactINR(h.totalInflow + h.totalOutflow)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-elevated text-cyan border border-border-active">
                      {h.totalFlowShare}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Module C: Property Scorecards Bento Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {houses.map((house) => {
          const isSurplus = house.netCashFlow >= 0;
          const totalFlow = house.totalInflow + house.totalOutflow;
          const inflowPercentage =
            totalFlow > 0
              ? Math.round((house.totalInflow / totalFlow) * 100)
              : 50;

          return (
            <div
              key={house.id}
              className="bg-card border border-border-subtle hover:border-border-contrast rounded-2xl p-5 shadow-xl transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs border"
                    style={{
                      backgroundColor: `${house.color}20`,
                      borderColor: `${house.color}40`,
                      color: house.color,
                    }}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {house.name}
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Base:{" "}
                      <span className="font-mono text-neutral-300">
                        {formatINR(house.initialCash)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                      isSurplus
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-danger/10 border-danger/20 text-danger"
                    }`}
                  >
                    {isSurplus ? (
                      <>
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Surplus</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-3 h-3" />
                        <span>Deficit</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* 4 Financial KPI Blocks in Card */}
              <div className="grid grid-cols-2 gap-2.5 my-3.5">
                {/* Inflow */}
                <div className="p-3 rounded-xl bg-surface border border-border-muted">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Total Inflow</span>
                    <span className="text-[10px] font-mono text-primary">
                      {house.inflowCount} Txs
                    </span>
                  </div>
                  <p className="font-mono font-bold text-sm text-primary">
                    +{formatINR(house.totalInflow)}
                  </p>
                  {house.topInflowCategory && (
                    <p className="text-[10px] text-neutral-400 truncate mt-1">
                      Top:{" "}
                      <span className="text-neutral-300 font-medium">
                        {house.topInflowCategory.category}
                      </span>
                    </p>
                  )}
                </div>

                {/* Outflow */}
                <div className="p-3 rounded-xl bg-surface border border-border-muted">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Total Outflow</span>
                    <span className="text-[10px] font-mono text-danger">
                      {house.outflowCount} Txs
                    </span>
                  </div>
                  <p className="font-mono font-bold text-sm text-danger">
                    -{formatINR(house.totalOutflow)}
                  </p>
                  {house.topOutflowCategory && (
                    <p className="text-[10px] text-neutral-400 truncate mt-1">
                      Top:{" "}
                      <span className="text-neutral-300 font-medium">
                        {house.topOutflowCategory.category}
                      </span>
                    </p>
                  )}
                </div>

                {/* Net Flow */}
                <div className="p-3 rounded-xl bg-surface border border-border-muted">
                  <span className="text-[11px] text-neutral-400 block mb-1">
                    Net Cash Position
                  </span>
                  <p
                    className={`font-mono font-bold text-sm ${
                      isSurplus ? "text-primary" : "text-danger"
                    }`}
                  >
                    {isSurplus ? "+" : ""}
                    {formatINR(house.netCashFlow)}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Margin:{" "}
                    {totalFlow > 0
                      ? ((house.netCashFlow / totalFlow) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>

                {/* Current Cash in Hand */}
                <div className="p-3 rounded-xl bg-surface border border-border-muted">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Cash in Hand</span>
                    {house.outstandingLoans > 0 && (
                      <span className="text-[10px] text-rose-400 font-mono">
                        -{formatCompactINR(house.outstandingLoans)} lent
                      </span>
                    )}
                  </div>
                  <p className="font-mono font-bold text-sm text-white">
                    {formatINR(house.currentCashInHand)}
                  </p>
                  <p className="text-[10px] text-cyan font-mono mt-1">
                    {house.totalFlowShare}% Portfolio Vol
                  </p>
                </div>
              </div>

              {/* Inflow vs Outflow Ratio Bar */}
              <div className="pt-2 border-t border-border-subtle">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 text-neutral-400">
                  <span>Flow Ratio: {inflowPercentage}% Inflow</span>
                  <span>{100 - inflowPercentage}% Outflow</span>
                </div>
                <div className="h-2 w-full rounded-full bg-danger/30 overflow-hidden flex">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${inflowPercentage}%` }}
                  />
                  <div
                    className="h-full bg-danger transition-all duration-500"
                    style={{ width: `${100 - inflowPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
