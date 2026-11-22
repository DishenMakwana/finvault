import React from "react";
import { getLoans } from "@/lib/actions/loan.actions";
import { getAllHouses } from "@/lib/actions/house.actions";
import { LoanCard } from "@/components/loans/loan-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LoanActions } from "@/components/loans/loan-actions";
import { formatINR } from "@/lib/formatters";
import { LoansPageProps } from "@/types/loans.types";

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const resolvedParams = await searchParams;
  const houseId = resolvedParams.houseId;

  const [houses, loans] = await Promise.all([
    getAllHouses(),
    getLoans(houseId),
  ]);

  // Summary Metrics
  const totalLent = loans.reduce((acc, l) => acc + Number(l.totalAmount), 0);
  const totalPaid = loans.reduce((acc, l) => acc + Number(l.amountPaid), 0);
  const totalOutstanding = totalLent - totalPaid;
  const fullySettledCount = loans.filter(
    (l) => l.status === "FULLY_PAID"
  ).length;
  const pendingCount = loans.length - fullySettledCount;

  return (
    <div className="space-y-6">
      {/* Title & Top Right Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Relative Loans & Repayments
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track loans given to relatives with one-shot settlements, multi-part
            installment logs, and promise dates.
          </p>
        </div>

        <LoanActions houses={houses.map((h) => ({ id: h.id, name: h.name }))} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          index={0}
          label="Total Loans Given"
          value={formatINR(totalLent)}
          iconName="loans"
          iconColor="text-loan-light"
          iconBg="bg-loan/10"
          iconBorder="border-loan/30"
          deltaText={`${loans.length} Relatives`}
          deltaType="neutral"
          subtext="Principal Lent"
        />

        <KpiCard
          index={1}
          label="Total Recovered"
          value={formatINR(totalPaid)}
          iconName="check"
          iconColor="text-primary"
          iconBg="bg-primary/10"
          iconBorder="border-primary/30"
          deltaText={
            totalLent > 0
              ? `${((totalPaid / totalLent) * 100).toFixed(0)}% Repaid`
              : "100%"
          }
          deltaType="positive"
          subtext="Received back"
        />

        <KpiCard
          index={2}
          label="Outstanding Balance"
          value={formatINR(totalOutstanding)}
          iconName="alert"
          iconColor="text-danger"
          iconBg="bg-danger/10"
          iconBorder="border-danger/30"
          deltaText={totalOutstanding > 0 ? "Action Needed" : "All Clear"}
          deltaType={totalOutstanding > 0 ? "negative" : "positive"}
          subtext="Yet to receive"
        />

        <KpiCard
          index={3}
          label="Settled Relatives"
          value={`${fullySettledCount} of ${loans.length}`}
          iconName="clock"
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          iconBorder="border-amber-500/30"
          deltaText={`${pendingCount} Active`}
          deltaType="neutral"
          subtext="Loan completion rate"
        />
      </div>

      {/* Loans Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Active & Past Relative Ledgers
          </h3>
          <span className="text-xs text-slate-400">
            {loans.length} Total Loans
          </span>
        </div>

        {loans.length === 0 ? (
          <div className="bg-card border border-border-subtle rounded-2xl p-12 text-center text-neutral-400">
            <p className="text-sm font-semibold">No loans recorded yet.</p>
            <p className="text-xs text-neutral-500 mt-1">
              Use the &quot;🤝 Give Loan&quot; button in the top bar to record
              your first relative loan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                houses={houses.map((h) => ({ id: h.id, name: h.name }))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
