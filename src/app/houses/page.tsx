import React from "react";
import { getHousesWithBalances } from "@/lib/actions/house.actions";
import { HouseList } from "@/components/houses/house-list";

export default async function HousesPage() {
  const { houses, totalCurrentCash, totalInitialCash } =
    await getHousesWithBalances();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Houses & Physical Cash Vaults
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Live physical cash in hand across all houses, reconciled against
          starting paper-book baselines and recorded transactions.
        </p>
      </div>

      <HouseList
        houses={houses}
        totalCurrentCash={totalCurrentCash}
        totalInitialCash={totalInitialCash}
      />
    </div>
  );
}
