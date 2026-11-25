import { requireAuth } from "@/lib/auth";
import {
  getHousesWithBalances,
  getAllHouses,
} from "@/lib/actions/house.actions";
import { HouseList } from "@/components/houses/house-list";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HousesPageProps } from "@/types/houses.types";

export default async function HousesPage({ searchParams }: HousesPageProps) {
  const [rawParams, cookieStore] = await Promise.all([
    searchParams ?? Promise.resolve(undefined),
    cookies(),
  ]);
  const resolvedParams = rawParams || {};
  const cookieHouseId = cookieStore.get("finvault_active_house")?.value;

  if (resolvedParams.houseId === undefined) {
    const [user, allHouses] = await Promise.all([
      requireAuth(),
      getAllHouses(),
    ]);
    const userHome =
      allHouses.find((h) => h.isOwner || h.userId === user?.id) || allHouses[0];
    const defaultHouseId = userHome ? String(userHome.id) : "ALL";
    const currentHouseId = cookieHouseId || defaultHouseId;
    redirect(`/houses?houseId=${currentHouseId}`);
  }

  // Single-wave parallel database execution
  const [, { houses, totalCurrentCash, totalInitialCash }] = await Promise.all([
    requireAuth(),
    getHousesWithBalances(resolvedParams.houseId),
  ]);

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
