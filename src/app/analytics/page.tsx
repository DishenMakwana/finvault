import { requireAuth } from "@/lib/auth";
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
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AnalyticsDatePreset,
  AnalyticsViewMode,
  AnalyticsPageProps,
} from "@/types/analytics.types";

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const resolvedParams = (await searchParams) || {};
  const cookieStore = await cookies();
  const cookieHouseId = cookieStore.get("finvault_active_house")?.value;

  if (resolvedParams.houseId === undefined) {
    const [user, houses] = await Promise.all([requireAuth(), getAllHouses()]);

    const userHome =
      houses.find((h) => h.isOwner || h.userId === user?.id) || houses[0];
    const defaultHouseId = userHome ? String(userHome.id) : "ALL";
    const currentHouseId = cookieHouseId || defaultHouseId;

    const params = new URLSearchParams();
    params.set("houseId", String(currentHouseId));
    if (resolvedParams.range) params.set("range", resolvedParams.range);
    if (resolvedParams.startDate)
      params.set("startDate", resolvedParams.startDate);
    if (resolvedParams.endDate) params.set("endDate", resolvedParams.endDate);
    if (resolvedParams.mode) params.set("mode", resolvedParams.mode);
    if (resolvedParams.rentalYear)
      params.set("rentalYear", resolvedParams.rentalYear);
    if (resolvedParams.rentalView)
      params.set("rentalView", resolvedParams.rentalView);
    redirect(`/analytics?${params.toString()}`);
  }

  const currentHouseId = resolvedParams.houseId;
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

  // Single-wave parallel fetch for all page dependencies
  const [, houses, houseAnalytics, analyticsData, rentalAnalytics] =
    await Promise.all([
      requireAuth(),
      getAllHouses(),
      getHouseAnalyticsData(currentHouseId),
      getCashflowAnalytics({
        houseId: currentHouseId,
        range: currentRange,
        startDate: currentStartDate,
        endDate: currentEndDate,
        mode: currentMode,
      }),
      getRentalIncomeAnalyticsData(rentalYear, currentHouseId),
    ]);

  const { summary } = analyticsData;
  const totalFlow = summary.totalInflow + summary.totalOutflow;
  const inflowRatio =
    totalFlow > 0 ? ((summary.totalInflow / totalFlow) * 100).toFixed(1) : "0";

  const hasNoData =
    summary.inflowTransactionCount === 0 &&
    summary.outflowTransactionCount === 0 &&
    summary.totalInflow === 0 &&
    summary.totalOutflow === 0;

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

      {hasNoData ? (
        <div className="bg-card border border-border-subtle rounded-2xl p-12 flex flex-col items-center justify-center text-neutral-400 min-h-[360px] text-center shadow-xl">
          <p className="text-sm font-medium text-neutral-300">
            No records found.
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Use &quot;+ Add Inflow&quot; or &quot;- Add Outflow&quot; above to
            start logging.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Inflow */}
            <KpiCard
              index={0}
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
              index={1}
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
              index={2}
              label="Net Cash Position"
              value={`${summary.netCashFlow >= 0 ? "+" : ""}${formatINR(summary.netCashFlow)}`}
              iconName="cash"
              iconColor={
                summary.netCashFlow >= 0 ? "text-primary" : "text-rose-400"
              }
              iconBg={
                summary.netCashFlow >= 0 ? "bg-primary/10" : "bg-rose-500/10"
              }
              iconBorder={
                summary.netCashFlow >= 0
                  ? "border-primary/30"
                  : "border-rose-500/30"
              }
              deltaText={
                summary.netCashFlow >= 0 ? "Net Surplus" : "Net Deficit"
              }
              deltaType={summary.netCashFlow >= 0 ? "positive" : "negative"}
              subtext="Inflow vs Outflow Margin"
            />

            {/* Card 4: Data Points & Range */}
            <KpiCard
              index={3}
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
            currentHouseId={currentHouseId}
          />
        </>
      )}
    </div>
  );
}
