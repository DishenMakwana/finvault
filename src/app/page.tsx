import { requireAuth } from "@/lib/auth";
import { getAllHouses } from "@/lib/actions/house.actions";
import { getDashboardSummary } from "@/lib/actions/cashflow.actions";
import { getUserActiveSessions } from "@/lib/actions/auth.actions";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { RecentFeed } from "@/components/dashboard/recent-feed";
import { CategoryBreakdownCard } from "@/components/dashboard/category-breakdown-card";
import { Clock } from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DashboardPageProps, CashflowTimeframe } from "@/types/dashboard.types";

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const [rawParams, cookieStore] = await Promise.all([searchParams, cookies()]);
  const resolvedParams = rawParams || {};
  const cookieHouseId = cookieStore.get("finvault_active_house")?.value;
  const currentTimeframe =
    (resolvedParams.timeframe as CashflowTimeframe) || "1Y";

  // If houseId is not present in URL parameters, determine target and redirect
  if (resolvedParams.houseId === undefined) {
    const [user, houses] = await Promise.all([requireAuth(), getAllHouses()]);
    const userHome =
      houses.find((h) => h.isOwner || h.userId === user?.id) || houses[0];
    const defaultHouseId = userHome ? String(userHome.id) : "ALL";
    const targetHouseId = cookieHouseId || defaultHouseId;

    const params = new URLSearchParams();
    params.set("houseId", String(targetHouseId));
    if (resolvedParams.timeframe) {
      params.set("timeframe", resolvedParams.timeframe);
    }
    redirect(`/?${params.toString()}`);
  }

  // Single-wave parallel database execution
  const [, summary, activeSessions] = await Promise.all([
    requireAuth(),
    getDashboardSummary(resolvedParams.houseId, currentTimeframe),
    getUserActiveSessions(),
  ]);

  if (!summary) {
    redirect("/login");
  }

  const {
    currentCashInHand,
    totalInitialCash,
    totalInflow,
    totalOutflow,
    netFlow,
    outstandingLoans,
    totalLoansDisbursed,
    totalLoansPaidBack,
    timelineData,
    recentTransactions,
    categoryBreakdown,
  } = summary;

  const recoveryRate =
    totalLoansDisbursed > 0
      ? ((totalLoansPaidBack / totalLoansDisbursed) * 100).toFixed(1)
      : "100";

  const cashDiff = currentCashInHand - totalInitialCash;

  // Top 5 highest valued categories
  const topCategories = [...categoryBreakdown]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Overview
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time physical cash tracking across {summary.houses.length}{" "}
            {summary.houses.length === 1 ? "house" : "houses"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-400 bg-card border border-border-subtle px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Reconciled Just Now
          </span>
        </div>
      </div>

      {/* Row 1: Bento KPI Cards (Dribbble/Pinterest Inspired Dark Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Current Cash in Hand */}
        <KpiCard
          index={0}
          label="Current Cash in Hand"
          value={formatINR(currentCashInHand)}
          iconName="cash"
          iconColor="text-primary"
          iconBg="bg-primary/10"
          iconBorder="border-primary/30"
          deltaText={
            cashDiff >= 0 ? `+${formatINR(cashDiff)}` : formatINR(cashDiff)
          }
          deltaType={cashDiff >= 0 ? "positive" : "negative"}
          subtext={`Base: ${formatINR(totalInitialCash)}`}
        />

        {/* Card 2: Total Inflow */}
        <KpiCard
          index={1}
          label="Total Inflow"
          value={formatINR(totalInflow)}
          iconName="inflow"
          iconColor="text-primary"
          iconBg="bg-primary/10"
          iconBorder="border-primary/30"
          deltaText="Incoming"
          deltaType="positive"
          subtext={`Recorded: ${summary.inflowCount} Transactions`}
        />

        {/* Card 3: Total Outflow */}
        <KpiCard
          index={2}
          label="Total Outflow"
          value={formatINR(totalOutflow)}
          iconName="outflow"
          iconColor="text-danger"
          iconBg="bg-danger/10"
          iconBorder="border-danger/30"
          deltaText="Outgoing"
          deltaType="negative"
          subtext={`Recorded: ${summary.outflowCount} Transactions`}
        />

        {/* Card 4: Relative Loans Outstanding */}
        <KpiCard
          index={3}
          label="Relative Loans (Due)"
          value={formatINR(outstandingLoans)}
          iconName="loans"
          iconColor="text-loan-light"
          iconBg="bg-loan/10"
          iconBorder="border-loan/30"
          deltaText={`${recoveryRate}% Recovered`}
          deltaType={Number(recoveryRate) >= 75 ? "positive" : "neutral"}
          subtext={`Lent: ${formatINR(totalLoansDisbursed)}`}
        />

        {/* Card 5: Active Sessions & Vault Guard */}
        <KpiCard
          index={4}
          label="Active Sessions"
          value={`${activeSessions.length} Device${activeSessions.length > 1 ? "s" : ""}`}
          iconName="sessions"
          iconColor="text-cyan"
          iconBg="bg-cyan/10"
          iconBorder="border-cyan/30"
          deltaText="JWT Guard"
          deltaType="positive"
          subtext="Status: Database Active"
        />
      </div>

      {/* Row 2: Interactive Cashflow Timeline & Category Pill Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashflowChart
            initialData={timelineData}
            currentHouseId={resolvedParams.houseId}
            initialTimeframe={currentTimeframe}
          />
        </div>

        {/* Category Breakdown Panel */}
        <CategoryBreakdownCard categories={topCategories} netFlow={netFlow} />
      </div>

      {/* Row 3: Recent Activity Stream */}
      <div>
        <RecentFeed transactions={recentTransactions} />
      </div>
    </div>
  );
}
