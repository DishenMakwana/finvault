import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/cache";
import { TargetHouseResolution } from "@/types/houses.types";

/**
 * Common dynamic query helper:
 * - Single select: resolves [1] with zero DB calls
 * - All houses: resolves [1, 2, ...] from local cache (60s TTL, tag: "houses")
 */
export async function resolveTargetHouseIds(
  houseIdParam?: string | number | null
): Promise<TargetHouseResolution> {
  const isAllParam =
    !houseIdParam || String(houseIdParam).trim().toUpperCase() === "ALL";

  if (!isAllParam) {
    const numId =
      typeof houseIdParam === "number"
        ? houseIdParam
        : parseInt(String(houseIdParam), 10);
    if (!isNaN(numId)) {
      return {
        targetIds: [numId],
        isAll: false,
        cacheKeySegment: `house:${numId}`,
      };
    }
  }

  let allIds = cacheGet<number[]>("houses:all_ids");
  if (!allIds) {
    const allHouses = await prisma.house.findMany({
      where: { deletedAt: null },
      select: { id: true },
      orderBy: { id: "asc" },
    });
    allIds = allHouses.map((h) => h.id);
    cacheSet("houses:all_ids", allIds, 60000, ["houses"]);
  }

  return {
    targetIds: allIds,
    isAll: true,
    cacheKeySegment: "houses:ALL",
  };
}
