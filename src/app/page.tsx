import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/actions/cashflow.actions";
import { getUserActiveSessions } from "@/lib/actions/auth.actions";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { RecentFeed } from "@/components/dashboard/recent-feed";
import { Clock } from "lucide-react";
import { formatINR, formatDate } from "@/lib/formatters";
import Link from "next/link";
import { DashboardPageProps, CashflowTimeframe } from "@/types/dashboard.types";

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const [user, resolvedParams] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);
  const currentHouseId = resolvedParams.houseId || "ALL";
  const currentTimeframe =
    (resolvedParams.timeframe as CashflowTimeframe) || "1Y";

  const [summary, activeSessions] = await Promise.all([
    getDashboardSummary(currentHouseId, currentTimeframe),
    user ? getUserActiveSessions() : Promise.resolve([]),
  ]);

  if (!summary) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Please log in to view your financial vault.</p>
      </div>
    );
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
            currentHouseId={currentHouseId}
            initialTimeframe={currentTimeframe}
          />
        </div>

        {/* Category Breakdown Panel */}
        <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Category Breakdown
              </h4>
              <span className="text-[11px] text-neutral-500">
                Top 5 by Value
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {topCategories.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">
                  No categories recorded yet.
                </p>
              ) : (
                topCategories.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border-muted"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cat.type === "INFLOW" ? "bg-primary" : "bg-danger"
                        }`}
                      />
                      <span className="text-xs font-semibold text-white capitalize">
                        {cat.category}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        ({cat.count})
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold ${
                        cat.type === "INFLOW" ? "text-primary" : "text-danger"
                      }`}
                    >
                      {formatINR(cat.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle mt-4 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Net Flow (In - Out):</span>
            <span
              className={`font-mono font-bold text-sm ${
                netFlow >= 0 ? "text-primary" : "text-danger"
              }`}
            >
              {netFlow >= 0 ? "+" : ""}
              {formatINR(netFlow)}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Activity Stream */}
      <div>
        <RecentFeed transactions={recentTransactions} />
      </div>
    </div>
  );
}
