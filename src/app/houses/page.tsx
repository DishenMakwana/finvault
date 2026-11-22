import { requireAuth } from "@/lib/auth";
import {
  getHousesWithBalances,
  getAllHouses,
} from "@/lib/actions/house.actions";
import { HouseList } from "@/components/houses/house-list";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HousesPage({
  searchParams,
}: {
  searchParams?: Promise<{ houseId?: string }>;
}) {
  const [user, resolvedParams, allHouses] = await Promise.all([
    requireAuth(),
    searchParams ? await searchParams : {},
    getAllHouses(),
  ]);
  const userHome =
    allHouses.find((h) => h.isOwner || h.userId === user?.id) || allHouses[0];
  const defaultHouseId = userHome ? String(userHome.id) : "ALL";
  const cookieStore = await cookies();
  const cookieHouseId = cookieStore.get("finvault_active_house")?.value;
  const currentHouseId =
    resolvedParams.houseId !== undefined
      ? resolvedParams.houseId
      : cookieHouseId || defaultHouseId;

  if (resolvedParams.houseId === undefined) {
    redirect(`/houses?houseId=${currentHouseId}`);
  }

  const { houses, totalCurrentCash, totalInitialCash } =
    await getHousesWithBalances(currentHouseId);

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
