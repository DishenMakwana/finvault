"use client";

import { useState, useTransition, useEffect } from "react";
import { motion } from "framer-motion";
import {
  KeyRound,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Home,
  X,
  TrendingUp,
  Percent,
  LayoutGrid,
  Rows3,
  Table2,
  Download,
  Loader2,
} from "lucide-react";
import {
  RentalIncomeAnalyticsSummary,
  RentalMonthCell,
  RentalUnitSummary,
  RentalIncomeSectionProps,
} from "@/types/analytics.types";
import { formatCompactINR, formatINR } from "@/lib/formatters";
import {
  toggleRentalVacancyAction,
  getRentalIncomeAnalyticsData,
} from "@/lib/actions/analytics.actions";
import { usePathname } from "next/navigation";

export function RentalIncomeSection({
  data: initialData,
  selectedYear: initialYear,
  initialViewMode = "TIMELINE",
  currentHouseId,
}: RentalIncomeSectionProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [activeYear, setActiveYear] = useState(initialYear);
  const [viewMode, setViewMode] = useState<"TIMELINE" | "MATRIX" | "TABLE">(
    initialViewMode || "TIMELINE"
  );
  const [summaryData, setSummaryData] =
    useState<RentalIncomeAnalyticsSummary>(initialData);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sync state if initialData from server changes
  useEffect(() => {
    setSummaryData(initialData);
    setActiveYear(initialYear);
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialData, initialYear, initialViewMode]);

  // Active inspect cell for modal dialog
  const [inspectCell, setInspectCell] = useState<{
    unit: RentalUnitSummary;
    cell: RentalMonthCell;
  } | null>(null);

  const {
    units,
    totalAnnualCollected,
    totalExpectedAnnualRent,
    overallCollectionRate,
    totalMissingMonths,
    totalVacantMonths,
    totalMultiMonthPayments,
    overallOccupancyRate,
    monthlyTotals,
    availableYears,
  } = summaryData;

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);
      const houseParam = currentHouseId ? `&houseId=${currentHouseId}` : "";
      const res = await fetch(
        `/api/export/rental-income?year=${activeYear}${houseParam}`
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FinVault_Rental_Income_${activeYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download rental Excel:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewModeChange = (mode: "TIMELINE" | "MATRIX" | "TABLE") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const val =
        mode === "TIMELINE"
          ? "breakdown"
          : mode === "MATRIX"
            ? "grid"
            : "table";
      params.set("rentalView", val);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }
  };

  const handleYearChange = (year: number) => {
    if (year === activeYear) return;
    setActiveYear(year);

    // Update browser URL silently without triggering full-page navigation or scroll jumping
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("rentalYear", String(year));
      const val =
        viewMode === "TIMELINE"
          ? "breakdown"
          : viewMode === "MATRIX"
            ? "grid"
            : "table";
      params.set("rentalView", val);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }

    startTransition(async () => {
      try {
        const updated = await getRentalIncomeAnalyticsData(
          year,
          currentHouseId
        );
        setSummaryData(updated);
      } catch (err) {
        console.error("Failed to load rental data for year:", err);
      }
    });
  };

  const handleToggleVacancy = async (
    unitName: string,
    month: number,
    isVacant: boolean
  ) => {
    try {
      await toggleRentalVacancyAction({
        unitName,
        year: activeYear,
        month,
        isVacant,
      });
      // In-place update without page refresh
      const updated = await getRentalIncomeAnalyticsData(
        activeYear,
        currentHouseId
      );
      setSummaryData(updated);
      setInspectCell(null);
    } catch (e) {
      console.error("Failed to toggle vacancy:", e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
      className={`space-y-4 pt-4 border-t border-border-subtle transition-opacity duration-200 ${
        isPending ? "opacity-75" : "opacity-100"
      }`}
    >
      {/* 1. Header Toolbar with Frosted Pill Controls */}
      <div className="bg-card border border-border-subtle rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Rental Income Intelligence & Occupancy Matrix</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  {units.length} {units.length === 1 ? "Unit" : "Units"} Tracked
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Yearly tracking across rental units, multi-month combined
                payment detection & vacancy status
              </p>
            </div>
          </div>

          {/* Year Selector Tabs (Matching Image 2 Frosted Style) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mr-1">
              Year:
            </span>
            <div className="inline-flex items-center p-1 rounded-xl bg-surface border border-neutral-800 text-xs gap-1">
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => handleYearChange(yr)}
                  disabled={isPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeYear === yr
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{yr}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top 6 KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Annual Rental Collected */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-4 rounded-2xl bg-card border border-border-subtle shadow-md"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Annual Collected</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-emerald-400">
            {formatINR(totalAnnualCollected)}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
            Target: {formatCompactINR(totalExpectedAnnualRent)}
          </span>
        </motion.div>

        {/* KPI 2: Collection Realization Rate */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-4 rounded-2xl bg-card border border-border-subtle shadow-md"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Collection Rate</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Percent className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-indigo-400">
            {overallCollectionRate}%
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
            Received vs Expected
          </span>
        </motion.div>

        {/* KPI 3: Overall Occupancy Rate */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-4 rounded-2xl bg-card border border-border-subtle shadow-md"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Occupancy Rate</span>
            <span className="p-1.5 rounded-lg bg-cyan/10 text-cyan border border-cyan/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-white">
            {overallOccupancyRate}%
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
            Occupied vs Eligible
          </span>
        </motion.div>

        {/* KPI 4: Missing / Overdue Months */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-4 rounded-2xl bg-card border border-border-subtle shadow-md"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Missing Months</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <p
            className={`text-lg font-bold font-mono ${
              totalMissingMonths > 0 ? "text-rose-400" : "text-neutral-400"
            }`}
          >
            {totalMissingMonths} {totalMissingMonths === 1 ? "Month" : "Months"}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
            {totalMissingMonths > 0
              ? "Unpaid / Unrecorded Rent"
              : "All Paid Up"}
          </span>
        </motion.div>

        {/* KPI 5: Vacant / Unrented Months */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-4 rounded-2xl bg-card border border-border-subtle shadow-md"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Vacant Months</span>
            <span className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700">
              <Home className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-neutral-300">
            {totalVacantMonths} {totalVacantMonths === 1 ? "Month" : "Months"}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
            No Tenant on Rent (Empty)
          </span>
        </motion.div>

        {/* KPI 6: 2-Month Combined Payments */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-4 rounded-2xl bg-card border border-border-subtle shadow-md"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Combined Payments</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-bold font-mono text-indigo-400">
            {totalMultiMonthPayments}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
            Multi-Month Rent Receipts
          </span>
        </motion.div>
      </div>

      {/* 3. Legend & View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-card/60 border border-border-subtle text-xs text-neutral-300">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span>2M Combined</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400/50 border border-indigo-400" />
            <span>Covered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>Missing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-neutral-700" />
            <span>Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-neutral-600" />
            <span>Upcoming</span>
          </div>
        </div>

        {/* View Switcher & Export Toolbar */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto flex-shrink-0">
          <div className="inline-flex items-center p-0.5 rounded-xl bg-surface border border-neutral-800 text-xs gap-1">
            <button
              type="button"
              onClick={() => handleViewModeChange("TIMELINE")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "TIMELINE"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <Rows3 className="w-3.5 h-3.5" />
              <span>Monthly Breakdown</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("MATRIX")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "MATRIX"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>12-Month Grid</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("TABLE")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "TABLE"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Simple Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-neutral-800 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            title="Download Rental Report (.xlsx)"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      {/* 4. Table Section */}
      <div className="bg-card border border-border-subtle rounded-2xl shadow-xl overflow-hidden">
        {viewMode === "MATRIX" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-muted bg-surface/80 text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 min-w-[130px] sticky left-0 bg-surface/95 backdrop-blur-md z-10 border-r border-border-muted">
                    Property
                  </th>
                  {monthlyTotals.map((m) => (
                    <th
                      key={m.month}
                      className="py-2 px-1 text-center min-w-[48px]"
                    >
                      {m.monthName}
                    </th>
                  ))}
                  <th className="py-2.5 px-2.5 text-right min-w-[95px] border-l border-border-muted">
                    FY Total
                  </th>
                  <th className="py-2.5 px-1.5 text-center min-w-[62px]">
                    Collect
                  </th>
                  <th className="py-2.5 px-1.5 text-center min-w-[58px]">
                    Occup
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {units.map((unit) => (
                  <tr
                    key={unit.unitName}
                    className="hover:bg-surface-hover/50 transition-colors"
                  >
                    {/* Sticky Unit Name Column */}
                    <td className="py-2.5 px-3 sticky left-0 bg-card/95 backdrop-blur-md z-10 border-r border-border-muted font-medium text-white">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-white tracking-tight text-xs truncate max-w-[130px]">
                            {unit.unitName}
                          </p>
                          {unit.expectedMonthlyRent > 0 && (
                            <span className="text-[9.5px] text-neutral-400 font-mono block">
                              ~{formatCompactINR(unit.expectedMonthlyRent)}/mo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 12 Monthly Cells */}
                    {unit.months.map((cell) => (
                      <td
                        key={cell.month}
                        onClick={() => setInspectCell({ unit, cell })}
                        className="py-1.5 px-0.5 text-center cursor-pointer"
                      >
                        {cell.status === "PAID" && (
                          <div className="py-1 px-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all text-center">
                            <span className="font-mono font-bold text-emerald-400 block text-[10px] leading-tight">
                              {formatCompactINR(cell.amount)}
                            </span>
                            <span className="text-[8px] text-emerald-400/80 font-mono block leading-none mt-0.5">
                              Paid
                            </span>
                          </div>
                        )}

                        {cell.status === "COMBINED_PRIMARY" && (
                          <div className="py-1 px-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 transition-all text-center">
                            <span className="font-mono font-bold text-indigo-300 block text-[10px] leading-tight">
                              {formatCompactINR(cell.amount)}
                            </span>
                            <span className="text-[8px] text-indigo-400 font-bold block leading-none mt-0.5 truncate">
                              ✨ 2M
                            </span>
                          </div>
                        )}

                        {cell.status === "COMBINED_COVERED" && (
                          <div className="py-1 px-0.5 rounded-md bg-indigo-950/40 hover:bg-indigo-950/60 border border-indigo-500/25 transition-all text-center">
                            <span className="font-mono font-semibold text-indigo-300/80 block text-[9.5px] leading-tight">
                              ~{formatCompactINR(cell.effectiveMonthlyAmount)}
                            </span>
                            <span className="text-[8px] text-cyan font-medium block leading-none mt-0.5">
                              🔗 Cov
                            </span>
                          </div>
                        )}

                        {cell.status === "MISSING" && (
                          <div className="py-1 px-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all text-center">
                            <span className="font-mono font-bold text-rose-400 block text-[10px] leading-tight">
                              ₹0
                            </span>
                            <span className="text-[8px] text-rose-400 font-bold block leading-none mt-0.5">
                              ⚠️ Miss
                            </span>
                          </div>
                        )}

                        {cell.status === "VACANT" && (
                          <div className="py-1 px-0.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 transition-all text-center">
                            <span className="text-neutral-400 block text-[10px] font-mono leading-tight">
                              —
                            </span>
                            <span className="text-[8px] text-neutral-400 font-medium block leading-none mt-0.5">
                              Empty
                            </span>
                          </div>
                        )}

                        {cell.status === "UPCOMING" && (
                          <div className="py-1 px-0.5 rounded-md border border-dashed border-neutral-800 text-center text-neutral-600">
                            <span className="text-[10px] block leading-tight">
                              —
                            </span>
                            <span className="text-[8px] block leading-none mt-0.5">
                              Soon
                            </span>
                          </div>
                        )}
                      </td>
                    ))}

                    {/* FY Total Collected */}
                    <td className="py-2.5 px-2.5 text-right border-l border-border-muted">
                      <p className="font-mono font-bold text-white text-[11px]">
                        {formatINR(unit.annualCollected)}
                      </p>
                      {unit.expectedAnnualRent > 0 && (
                        <span className="text-[9.5px] text-neutral-400 font-mono block">
                          of {formatCompactINR(unit.expectedAnnualRent)}
                        </span>
                      )}
                    </td>

                    {/* Collection Realization Rate */}
                    <td className="py-2.5 px-1.5 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                          unit.collectionRate >= 95
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : unit.collectionRate >= 80
                              ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {unit.collectionRate}%
                      </span>
                    </td>

                    {/* Occupancy Rate */}
                    <td className="py-2.5 px-1.5 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                          unit.occupancyRate >= 90
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : unit.occupancyRate >= 70
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {unit.occupancyRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Footer Summary Row */}
              <tfoot>
                <tr className="border-t-2 border-border-muted bg-surface/90 font-bold text-xs">
                  <td className="py-2.5 px-3 sticky left-0 bg-surface/95 backdrop-blur-md z-10 border-r border-border-muted text-white uppercase tracking-wider text-[10.5px]">
                    Total
                  </td>
                  {monthlyTotals.map((m) => (
                    <td
                      key={m.month}
                      className="py-2 px-0.5 text-center font-mono text-[10px] text-white"
                    >
                      {m.total > 0 ? (
                        <span className="text-primary font-bold">
                          {formatCompactINR(m.total)}
                        </span>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>
                  ))}
                  <td className="py-2.5 px-2.5 text-right border-l border-border-muted">
                    <p className="font-mono font-bold text-primary text-xs">
                      {formatINR(totalAnnualCollected)}
                    </p>
                    {totalExpectedAnnualRent > 0 && (
                      <span className="text-[9.5px] text-neutral-400 font-mono block">
                        Target: {formatCompactINR(totalExpectedAnnualRent)}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-indigo-400 text-[10px]">
                    {overallCollectionRate}%
                  </td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-bold text-cyan text-[10px]">
                    {overallOccupancyRate}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : viewMode === "TIMELINE" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-muted bg-surface/80 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[130px] border-r border-border-muted">
                    Month
                  </th>
                  {units.map((unit) => (
                    <th
                      key={unit.unitName}
                      className="py-3 px-3 min-w-[160px] text-center"
                    >
                      <div className="font-bold text-white text-xs truncate">
                        {unit.unitName}
                      </div>
                      {unit.expectedMonthlyRent > 0 && (
                        <span className="text-[10px] text-neutral-400 font-mono font-normal block">
                          ~{formatCompactINR(unit.expectedMonthlyRent)}/mo
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right min-w-[140px] border-l border-border-muted">
                    Monthly Flow
                  </th>
                  <th className="py-3 px-4 text-center min-w-[120px]">
                    Month Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {monthlyTotals.map((m) => {
                  const monthUnitCells = units.map((u) => {
                    const cell = u.months.find((c) => c.month === m.month);
                    return { unit: u, cell };
                  });

                  const paidCount = monthUnitCells.filter(
                    (item) =>
                      item.cell?.status === "PAID" ||
                      item.cell?.status === "COMBINED_PRIMARY" ||
                      item.cell?.status === "COMBINED_COVERED"
                  ).length;
                  const missingCount = monthUnitCells.filter(
                    (item) => item.cell?.status === "MISSING"
                  ).length;
                  const isUpcoming = monthUnitCells.every(
                    (item) => item.cell?.status === "UPCOMING"
                  );

                  return (
                    <tr
                      key={m.month}
                      className="hover:bg-surface-hover/50 transition-colors"
                    >
                      {/* Month Column */}
                      <td className="py-3 px-4 font-bold text-white border-r border-border-muted flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                        <span>
                          {m.monthName} {activeYear}
                        </span>
                      </td>

                      {/* Each Property Cell */}
                      {monthUnitCells.map(({ unit, cell }) => {
                        if (!cell)
                          return (
                            <td key={unit.unitName} className="text-center">
                              —
                            </td>
                          );
                        return (
                          <td
                            key={unit.unitName}
                            onClick={() => setInspectCell({ unit, cell })}
                            className="py-2.5 px-3 text-center cursor-pointer"
                          >
                            {cell.status === "PAID" && (
                              <div className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all text-center">
                                <span className="font-mono font-bold text-emerald-400 block text-xs">
                                  {formatINR(cell.amount)}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                                  ✓ Paid in Full
                                </span>
                              </div>
                            )}

                            {cell.status === "COMBINED_PRIMARY" && (
                              <div className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 transition-all text-center">
                                <span className="font-mono font-bold text-indigo-300 block text-xs">
                                  {formatINR(cell.amount)}
                                </span>
                                <span className="text-[10px] text-indigo-400 font-bold block mt-0.5">
                                  ✨ 2-Month Rent
                                </span>
                              </div>
                            )}

                            {cell.status === "COMBINED_COVERED" && (
                              <div className="p-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-950/60 border border-indigo-500/25 transition-all text-center">
                                <span className="font-mono font-semibold text-indigo-300 block text-xs">
                                  ~{formatINR(cell.effectiveMonthlyAmount)}
                                </span>
                                <span className="text-[10px] text-cyan font-medium block mt-0.5">
                                  🔗 Covered
                                </span>
                              </div>
                            )}

                            {cell.status === "MISSING" && (
                              <div className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all text-center">
                                <span className="font-mono font-bold text-rose-400 block text-xs">
                                  ₹ 0.00
                                </span>
                                <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                                  ⚠️ Overdue / Missing
                                </span>
                              </div>
                            )}

                            {cell.status === "VACANT" && (
                              <div className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 transition-all text-center">
                                <span className="text-neutral-400 block text-xs font-mono">
                                  —
                                </span>
                                <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">
                                  Vacant (Empty)
                                </span>
                              </div>
                            )}

                            {cell.status === "UPCOMING" && (
                              <div className="p-2 rounded-xl border border-dashed border-neutral-800 text-center text-neutral-600">
                                <span className="text-xs block">—</span>
                                <span className="text-[10px] block mt-0.5">
                                  Upcoming
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Monthly Total */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-white border-l border-border-muted text-xs">
                        {m.total > 0 ? (
                          <span className="text-primary font-bold">
                            {formatINR(m.total)}
                          </span>
                        ) : (
                          <span className="text-neutral-500 font-normal">
                            —
                          </span>
                        )}
                      </td>

                      {/* Month Status */}
                      <td className="py-3 px-4 text-center">
                        {isUpcoming ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono border border-dashed border-neutral-700 text-neutral-500">
                            Upcoming
                          </span>
                        ) : missingCount === 0 ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            All Paid ({paidCount}/{units.length})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            {missingCount} Overdue
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer Summary */}
              <tfoot>
                <tr className="border-t-2 border-border-muted bg-surface/90 font-bold text-xs">
                  <td className="py-3.5 px-4 text-white uppercase tracking-wider text-[11px] border-r border-border-muted">
                    Annual Total
                  </td>
                  {units.map((unit) => (
                    <td key={unit.unitName} className="py-3.5 px-3 text-center">
                      <p className="font-mono font-bold text-white text-xs">
                        {formatINR(unit.annualCollected)}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5 font-mono text-[10px]">
                        <span className="text-indigo-400 font-bold">
                          {unit.collectionRate}% Realized
                        </span>
                        <span className="text-neutral-500">•</span>
                        <span className="text-cyan">
                          {unit.occupancyRate}% Occupied
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-primary border-l border-border-muted text-sm">
                    <p>{formatINR(totalAnnualCollected)}</p>
                    <span className="text-[10px] text-neutral-400 font-normal block mt-0.5">
                      Target: {formatCompactINR(totalExpectedAnnualRent)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {overallCollectionRate}% Realized
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-muted bg-surface/80 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 min-w-[180px] border-r border-border-muted">
                    Property / Rental Unit
                  </th>
                  <th className="py-3.5 px-3 text-right min-w-[110px]">
                    Monthly Rent
                  </th>
                  <th className="py-3.5 px-3 text-right min-w-[125px]">
                    Annual Target
                  </th>
                  <th className="py-3.5 px-3 text-right min-w-[130px]">
                    Total Received
                  </th>
                  <th className="py-3.5 px-3 text-right min-w-[125px]">
                    Balance Due
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[110px]">
                    Paid Months
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[160px]">
                    Missing Months
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[130px]">
                    Vacant Months
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[95px]">
                    Collection
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[95px]">
                    Occupancy
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[130px] border-l border-border-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {units.map((unit) => {
                  const balanceDue = Math.max(
                    0,
                    unit.expectedAnnualRent - unit.annualCollected
                  );
                  const missingMonths = unit.months.filter(
                    (m) => m.status === "MISSING"
                  );
                  const vacantMonths = unit.months.filter(
                    (m) => m.status === "VACANT"
                  );
                  const isUpToDate = missingMonths.length === 0;

                  return (
                    <tr
                      key={unit.unitName}
                      className="hover:bg-surface-hover/50 transition-colors"
                    >
                      {/* Property / Unit */}
                      <td className="py-3.5 px-4 border-r border-border-muted">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex-shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs tracking-tight">
                              {unit.unitName}
                            </p>
                            {unit.houseName && (
                              <span className="text-[10.5px] text-neutral-400 font-medium block mt-0.5">
                                {unit.houseName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Monthly Rent */}
                      <td className="py-3.5 px-3 text-right font-mono text-neutral-300 font-semibold">
                        {unit.expectedMonthlyRent > 0
                          ? `${formatINR(unit.expectedMonthlyRent)}/mo`
                          : "—"}
                      </td>

                      {/* Annual Target */}
                      <td className="py-3.5 px-3 text-right font-mono text-white font-bold">
                        {unit.expectedAnnualRent > 0
                          ? formatINR(unit.expectedAnnualRent)
                          : "—"}
                      </td>

                      {/* Total Received */}
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-bold">
                        {formatINR(unit.annualCollected)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {balanceDue > 0 ? (
                          <span className="text-rose-400 font-bold">
                            -{formatINR(balanceDue)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">
                            ✓ Paid Up
                          </span>
                        )}
                      </td>

                      {/* Paid Months */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-white">
                            {unit.paidMonthsCount} / 12
                          </span>
                          <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (unit.paidMonthsCount / 12) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Missing Months Badges */}
                      <td className="py-3.5 px-3 text-center">
                        {missingMonths.length > 0 ? (
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {missingMonths.map((m) => (
                              <button
                                key={m.month}
                                type="button"
                                onClick={() =>
                                  setInspectCell({ unit, cell: m })
                                }
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-all cursor-pointer"
                                title={`Click to inspect or toggle vacancy for ${m.monthName}`}
                              >
                                {m.monthName}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-500 font-mono">
                            None
                          </span>
                        )}
                      </td>

                      {/* Vacant Months Badges */}
                      <td className="py-3.5 px-3 text-center">
                        {vacantMonths.length > 0 ? (
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {vacantMonths.map((m) => (
                              <button
                                key={m.month}
                                type="button"
                                onClick={() =>
                                  setInspectCell({ unit, cell: m })
                                }
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 transition-all cursor-pointer"
                                title={`Vacant in ${m.monthName}`}
                              >
                                {m.monthName}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-500 font-mono">
                            None
                          </span>
                        )}
                      </td>

                      {/* Collection Rate */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold ${
                            unit.collectionRate >= 95
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : unit.collectionRate >= 80
                                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {unit.collectionRate}%
                        </span>
                      </td>

                      {/* Occupancy Rate */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold ${
                            unit.occupancyRate >= 90
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : unit.occupancyRate >= 70
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {unit.occupancyRate}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center border-l border-border-muted">
                        {isUpToDate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Up to Date</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{missingMonths.length} Due</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer */}
              <tfoot>
                <tr className="border-t-2 border-border-muted bg-surface/90 font-bold text-xs">
                  <td className="py-3.5 px-4 border-r border-border-muted text-white uppercase tracking-wider text-[11px]">
                    Portfolio Totals
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-neutral-500">
                    —
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-white text-xs">
                    {formatINR(totalExpectedAnnualRent)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-primary text-xs">
                    {formatINR(totalAnnualCollected)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-xs">
                    {totalExpectedAnnualRent - totalAnnualCollected > 0 ? (
                      <span className="text-rose-400">
                        -
                        {formatINR(
                          totalExpectedAnnualRent - totalAnnualCollected
                        )}
                      </span>
                    ) : (
                      <span className="text-primary">₹0.00</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-white text-xs">
                    {units.reduce((acc, u) => acc + u.paidMonthsCount, 0)} /{" "}
                    {units.length * 12}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-rose-400 text-xs">
                    {totalMissingMonths > 0
                      ? `${totalMissingMonths} Missing`
                      : "None"}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-neutral-400 text-xs">
                    {totalVacantMonths > 0
                      ? `${totalVacantMonths} Vacant`
                      : "None"}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-indigo-400 text-xs">
                    {overallCollectionRate}%
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-cyan text-xs">
                    {overallOccupancyRate}%
                  </td>
                  <td className="py-3.5 px-4 text-center border-l border-border-muted font-mono text-xs text-neutral-400">
                    {totalMissingMonths === 0
                      ? "100% Settled"
                      : "Action Needed"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* 5. Cell Inspector / Vacancy Toggle Modal */}
      {inspectCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-modal border border-border-muted rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">
                  {inspectCell.unit.unitName} — {inspectCell.cell.monthName}{" "}
                  {activeYear}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectCell(null)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border-muted">
                <span className="text-neutral-400">Current Status:</span>
                <span
                  className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                    inspectCell.cell.status === "PAID"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : inspectCell.cell.status === "COMBINED_PRIMARY"
                        ? "bg-indigo-500/20 text-indigo-400"
                        : inspectCell.cell.status === "COMBINED_COVERED"
                          ? "bg-cyan/20 text-cyan"
                          : inspectCell.cell.status === "VACANT"
                            ? "bg-neutral-800 text-neutral-300"
                            : inspectCell.cell.status === "MISSING"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {inspectCell.cell.status === "COMBINED_PRIMARY"
                    ? "2M Combined Rent Paid"
                    : inspectCell.cell.status === "COMBINED_COVERED"
                      ? `Covered with Month #${inspectCell.cell.coveredByMonth}`
                      : inspectCell.cell.status === "VACANT"
                        ? "Vacant (Unrented / Empty)"
                        : inspectCell.cell.status === "MISSING"
                          ? "Missing Rent Payment"
                          : inspectCell.cell.status === "PAID"
                            ? "Paid in Full"
                            : "Upcoming Month"}
                </span>
              </div>

              {inspectCell.cell.transactionId && (
                <>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-400">Amount Paid:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {formatINR(inspectCell.cell.amount)}
                    </span>
                  </div>
                  {inspectCell.cell.effectiveMonthlyAmount !==
                    inspectCell.cell.amount && (
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-400">
                        Effective Monthly Share:
                      </span>
                      <span className="font-mono font-bold text-indigo-300">
                        {formatINR(inspectCell.cell.effectiveMonthlyAmount)}/mo
                      </span>
                    </div>
                  )}
                  {inspectCell.cell.transactionDate && (
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-400">Payment Date:</span>
                      <span className="font-mono text-neutral-200">
                        {inspectCell.cell.transactionDate}
                      </span>
                    </div>
                  )}
                  {inspectCell.cell.transactionTitle && (
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-400">Statement Title:</span>
                      <span className="font-mono text-neutral-200 truncate max-w-[200px]">
                        {inspectCell.cell.transactionTitle}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Property Annual Summary */}
              <div className="p-2.5 rounded-xl bg-surface border border-border-muted text-xs space-y-1.5">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-400">Monthly Rent:</span>
                  <span className="font-mono font-bold text-white">
                    {formatINR(inspectCell.unit.expectedMonthlyRent)}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-400">Annual Collection:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {formatINR(inspectCell.unit.annualCollected)}{" "}
                    <span className="text-[10px] text-neutral-400 font-normal">
                      / {formatCompactINR(inspectCell.unit.expectedAnnualRent)}{" "}
                      ({inspectCell.unit.collectionRate}%)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-400">Occupancy Rate:</span>
                  <span className="font-mono font-bold text-cyan">
                    {inspectCell.unit.occupancyRate}%
                  </span>
                </div>
              </div>

              {/* Explanatory text */}
              <div className="p-3 rounded-xl bg-surface/50 border border-border-subtle text-[11px] text-neutral-400 leading-relaxed">
                {inspectCell.cell.status === "VACANT" ? (
                  <p>
                    This property has been marked as{" "}
                    <strong>Vacant/Empty</strong> for{" "}
                    {inspectCell.cell.monthName} {activeYear}. It is excluded
                    from missing payments and does not penalize occupancy.
                  </p>
                ) : inspectCell.cell.status === "MISSING" ? (
                  <p>
                    No rental income payment was recorded for this month. If no
                    tenant occupied the property during this period, you can
                    mark it as <strong>Vacant/Empty</strong> below.
                  </p>
                ) : inspectCell.cell.status === "COMBINED_PRIMARY" ? (
                  <p>
                    This transaction combined multiple months of rent (months{" "}
                    {inspectCell.cell.coveredMonths?.join(" & ")}). Both months
                    are accounted for as collected.
                  </p>
                ) : inspectCell.cell.status === "COMBINED_COVERED" ? (
                  <p>
                    Rent for this month was paid in advance as part of the
                    combined payment in month #{inspectCell.cell.coveredByMonth}
                    .
                  </p>
                ) : (
                  <p>Rent was received and reconciled successfully.</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              {inspectCell.cell.status === "VACANT" ? (
                <button
                  type="button"
                  onClick={() =>
                    handleToggleVacancy(
                      inspectCell.unit.unitName,
                      inspectCell.cell.month,
                      false
                    )
                  }
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer"
                >
                  Unmark Vacant (Restore)
                </button>
              ) : inspectCell.cell.status === "MISSING" ? (
                <button
                  type="button"
                  onClick={() =>
                    handleToggleVacancy(
                      inspectCell.unit.unitName,
                      inspectCell.cell.month,
                      true
                    )
                  }
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Mark as Vacant (Empty)</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setInspectCell(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-hover border border-border-muted text-neutral-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
