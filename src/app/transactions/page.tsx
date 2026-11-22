import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getAllHouses } from "@/lib/actions/house.actions";
import {
  getTransactions,
  getUniqueCategories,
} from "@/lib/actions/cashflow.actions";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionActions } from "@/components/transactions/transaction-actions";
import { formatINR } from "@/lib/formatters";
import { TransactionsPageProps } from "@/types/transactions.types";

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  // Parallelize auth, route parameters, and initial houses query
  const [user, resolvedParams, houses] = await Promise.all([
    getCurrentUser(),
    searchParams,
    getAllHouses(),
  ]);

  const userHome =
    houses.find((h) => h.isOwner || h.userId === user?.id) || houses[0];
  const defaultHouseId = userHome ? String(userHome.id) : undefined;
  const effectiveHouseId =
    resolvedParams.houseId !== undefined
      ? resolvedParams.houseId
      : defaultHouseId || "ALL";

  // Execute transaction filtering with direct database-level sorting and category lookups in parallel
  const [transactions, categories, inflowCategories, outflowCategories] =
    await Promise.all([
      getTransactions({
        houseId: effectiveHouseId,
        type: resolvedParams.type,
        category: resolvedParams.category,
        startDate: resolvedParams.startDate,
        endDate: resolvedParams.endDate,
        minAmount: resolvedParams.minAmount
          ? parseFloat(resolvedParams.minAmount)
          : undefined,
        maxAmount: resolvedParams.maxAmount
          ? parseFloat(resolvedParams.maxAmount)
          : undefined,
        search: resolvedParams.search,
        sortBy: resolvedParams.sortBy,
        sortOrder: resolvedParams.sortOrder === "asc" ? "asc" : "desc",
        isFlagged:
          resolvedParams.flagged === "true" || resolvedParams.flagged === "1"
            ? true
            : resolvedParams.flagged === "false" ||
                resolvedParams.flagged === "0"
              ? false
              : undefined,
      }),
      getUniqueCategories(),
      getUniqueCategories("INFLOW"),
      getUniqueCategories("OUTFLOW"),
    ]);

  // Calculate summary metrics for KPI cards
  let totalInflow = 0;
  let totalOutflow = 0;
  let inflowCount = 0;
  let outflowCount = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount);
    if (t.type === "INFLOW") {
      totalInflow += amt;
      inflowCount++;
    } else {
      totalOutflow += amt;
      outflowCount++;
    }
  });

  const netFlow = totalInflow - totalOutflow;

  return (
    <div className="space-y-6">
      {/* Title & Top Right Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Transactions & Analytics
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Detailed log of cash inflows, outflows, and Excel export across your
            properties.
          </p>
        </div>

        <TransactionActions
          houses={houses.map((h) => ({ id: h.id, name: h.name }))}
          inflowCategories={inflowCategories}
          outflowCategories={outflowCategories}
          defaultHouseId={defaultHouseId}
        />
      </div>

      {/* Row: Bento KPI Cards (Matches Overview Tab) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Inflow */}
        <KpiCard
          index={0}
          label="Total Inflow"
          value={formatINR(totalInflow)}
          iconName="inflow"
          iconColor="text-primary"
          iconBg="bg-primary/10"
          iconBorder="border-primary/30"
          deltaText="Incoming"
          deltaType="positive"
          subtext={`${inflowCount} Inflow Transactions`}
        />

        {/* Card 2: Total Outflow */}
        <KpiCard
          index={1}
          label="Total Outflow"
          value={formatINR(totalOutflow)}
          iconName="outflow"
          iconColor="text-danger"
          iconBg="bg-danger/10"
          iconBorder="border-danger/30"
          deltaText="Outgoing"
          deltaType="negative"
          subtext={`${outflowCount} Outflow Transactions`}
        />

        {/* Card 3: Net Cash Flow */}
        <KpiCard
          index={2}
          label="Net Cash Flow"
          value={`${netFlow >= 0 ? "+" : ""}${formatINR(netFlow)}`}
          iconName="cash"
          iconColor={netFlow >= 0 ? "text-primary" : "text-danger"}
          iconBg={netFlow >= 0 ? "bg-primary/10" : "bg-danger/10"}
          iconBorder={netFlow >= 0 ? "border-primary/30" : "border-danger/30"}
          deltaText={netFlow >= 0 ? "Net Surplus" : "Net Deficit"}
          deltaType={netFlow >= 0 ? "positive" : "negative"}
          subtext="Inflow vs Outflow"
        />

        {/* Card 4: Filtered Records */}
        <KpiCard
          index={3}
          label="Filtered Records"
          value={`${transactions.length} Records`}
          iconName="sessions"
          iconColor="text-cyan"
          iconBg="bg-cyan/10"
          iconBorder="border-cyan/30"
          deltaText={`${inflowCount} In · ${outflowCount} Out`}
          deltaType="neutral"
          subtext="Matching Active Filters"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        houses={houses.map((h) => ({ id: h.id, name: h.name }))}
        categories={categories}
        totalCount={transactions.length}
        defaultHouseId={defaultHouseId}
      />

      {/* Transactions Data Grid */}
      <TransactionTable
        transactions={transactions}
        houses={houses.map((h) => ({ id: h.id, name: h.name }))}
        inflowCategories={inflowCategories}
        outflowCategories={outflowCategories}
      />
    </div>
  );
}
