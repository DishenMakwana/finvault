import { prisma } from "@/lib/prisma";
import { TargetHouseResolution } from "@/types/houses.types";

/**
 * Common dynamic query helper:
 * - Single select: resolves [1]
 * - All houses: resolves [1, 2]
 * Keyed uniquely for local memory caching
 */
export async function resolveTargetHouseIds(
  houseIdParam?: string | number | null
): Promise<TargetHouseResolution> {
  const allHouses = await prisma.house.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  const allIds = allHouses.map((h) => h.id);

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

  return {
    targetIds: allIds,
    isAll: true,
    cacheKeySegment: "houses:ALL",
  };
}
