import React from "react";
import { getAllHouses } from "@/lib/actions/house.actions";
import {
  getCashflowAnalytics,
  getHouseAnalyticsData,
  getRentalIncomeAnalyticsData,
} from "@/lib/actions/analytics.actions";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CashflowAnalyticsChart } from "@/components/analytics/cashflow-analytics-chart";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { HouseAnalyticsSection } from "@/components/analytics/house-analytics-section";
import { RentalIncomeSection } from "@/components/analytics/rental-income-section";
import { formatINR } from "@/lib/formatters";
import {
  AnalyticsDatePreset,
  AnalyticsViewMode,
  AnalyticsPageProps,
} from "@/types/analytics.types";

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const resolvedParams = await searchParams;
  const currentHouseId = resolvedParams.houseId || "ALL";
  const currentRange = (resolvedParams.range as AnalyticsDatePreset) || "1Y";
  const currentStartDate = resolvedParams.startDate;
  const currentEndDate = resolvedParams.endDate;
  const currentMode =
    (resolvedParams.mode as AnalyticsViewMode) || "cumulative";
  const currentRunningYear = new Date().getFullYear();
  const rentalYear = resolvedParams.rentalYear
    ? parseInt(resolvedParams.rentalYear, 10)
    : currentRunningYear;
  const rentalView =
    resolvedParams.rentalView === "grid"
      ? "MATRIX"
      : resolvedParams.rentalView === "table"
        ? "TABLE"
        : "TIMELINE";

  // Run all independent queries in parallel
  const [houses, houseAnalytics, analyticsData, rentalAnalytics] =
    await Promise.all([
      getAllHouses(),
      getHouseAnalyticsData(),
      getCashflowAnalytics({
        houseId: currentHouseId,
        range: currentRange,
        startDate: currentStartDate,
        endDate: currentEndDate,
        mode: currentMode,
      }),
      getRentalIncomeAnalyticsData(rentalYear),
    ]);

  const { summary } = analyticsData;
  const totalFlow = summary.totalInflow + summary.totalOutflow;
  const inflowRatio =
    totalFlow > 0 ? ((summary.totalInflow / totalFlow) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Cash Flow & Trend Analytics
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          In-depth comparative graphical analysis of cash inflows and outflows
          with transaction event markers.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inflow */}
        <KpiCard
          label="Total Inflow"
          value={formatINR(summary.totalInflow)}
          iconName="inflow"
          iconColor="text-primary"
          iconBg="bg-primary/10"
          iconBorder="border-primary/30"
          deltaText={`${inflowRatio}% of Flow`}
          deltaType="positive"
          subtext={`${summary.inflowTransactionCount} Inflow Transactions`}
        />

        {/* Card 2: Total Outflow */}
        <KpiCard
          label="Total Outflow"
          value={formatINR(summary.totalOutflow)}
          iconName="outflow"
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10"
          iconBorder="border-rose-500/30"
          deltaText="Expenditure"
          deltaType="negative"
          subtext={`${summary.outflowTransactionCount} Outflow Transactions`}
        />

        {/* Card 3: Net Cash Flow */}
        <KpiCard
          label="Net Cash Position"
          value={`${summary.netCashFlow >= 0 ? "+" : ""}${formatINR(summary.netCashFlow)}`}
          iconName="cash"
          iconColor={
            summary.netCashFlow >= 0 ? "text-primary" : "text-rose-400"
          }
          iconBg={summary.netCashFlow >= 0 ? "bg-primary/10" : "bg-rose-500/10"}
          iconBorder={
            summary.netCashFlow >= 0
              ? "border-primary/30"
              : "border-rose-500/30"
          }
          deltaText={summary.netCashFlow >= 0 ? "Net Surplus" : "Net Deficit"}
          deltaType={summary.netCashFlow >= 0 ? "positive" : "negative"}
          subtext="Inflow vs Outflow Margin"
        />

        {/* Card 4: Data Points & Range */}
        <KpiCard
          label="Active Window"
          value={`${summary.dataPointCount} Points`}
          iconName="sessions"
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
          iconBorder="border-indigo-500/30"
          deltaText={currentRange}
          deltaType="neutral"
          subtext={`${summary.startDate} to ${summary.endDate}`}
        />
      </div>

      {/* Main Interactive Trend Chart Section */}
      <CashflowAnalyticsChart
        initialData={analyticsData}
        houses={houses.map((h) => ({ id: h.id, name: h.name }))}
        currentHouseId={currentHouseId}
        currentRange={currentRange}
        currentStartDate={currentStartDate}
        currentEndDate={currentEndDate}
        currentMode={currentMode}
      />

      {/* In-Depth Category Distribution & Benchmark Bar Chart */}
      <CategoryBarChart
        inflowCategories={analyticsData.categories.inflow}
        outflowCategories={analyticsData.categories.outflow}
        combinedCategories={analyticsData.categories.combined}
        defaultType="COMBINED"
      />

      {/* Multi-Property & House Financial Intelligence Dashboard */}
      <HouseAnalyticsSection data={houseAnalytics} />

      {/* Yearly Rental Income & Occupancy Matrix */}
      <RentalIncomeSection
        data={rentalAnalytics}
        selectedYear={rentalYear}
        initialViewMode={rentalView}
      />
    </div>
  );
}
