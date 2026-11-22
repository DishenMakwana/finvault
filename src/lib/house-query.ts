import { prisma } from "@/lib/prisma";

export interface TargetHouseResolution {
  targetIds: number[];
  isAll: boolean;
  cacheKeySegment: string;
}

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

  if (houseIdParam && houseIdParam !== "ALL") {
    const numId =
      typeof houseIdParam === "number"
        ? houseIdParam
        : parseInt(String(houseIdParam), 10);
    if (!isNaN(numId) && allIds.includes(numId)) {
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
    cacheKeySegment: `houses:${allIds.join(",")}`,
  };
}
