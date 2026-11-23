"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cacheGet, cacheSet, cacheInvalidateTag } from "@/lib/cache";
import { resolveTargetHouseIds } from "@/lib/house-query";

export async function getAllHouses() {
  const user = await getCurrentUser();
  if (!user) return [];

  let houses = cacheGet<any[]>("houses:raw");
  if (!houses) {
    houses = await prisma.house.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        address: true,
        initialCash: true,
        initialCashDate: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    cacheSet("houses:raw", houses, 60000, ["houses"]);
  }

  // Sort so user's own houses appear first
  const sorted = [...houses].sort((a, b) => {
    if (a.userId === user.id && b.userId !== user.id) return -1;
    if (a.userId !== user.id && b.userId === user.id) return 1;
    return a.id - b.id;
  });

  return sorted.map((h) => ({
    id: h.id,
    userId: h.userId,
    name: h.name,
    address: h.address,
    initialCash: Number(h.initialCash),
    initialCashDate: h.initialCashDate,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
    deletedAt: h.deletedAt,
    isOwner: h.userId === user.id,
    ownerName: h.user?.name || h.user?.email || "Family Member",
  }));
}

export async function getHousesWithBalances(selectedHouseId?: string | number) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      houses: [],
      totalCurrentCash: 0,
      totalInitialCash: 0,
    };
  }

  const { targetIds, cacheKeySegment } =
    await resolveTargetHouseIds(selectedHouseId);
  const cacheKey = `houses:balances:${user.id}:${cacheKeySegment}`;
  const cached = cacheGet<any>(cacheKey);
  if (cached) return cached;

  const [houses, transactions, loans] = await Promise.all([
    prisma.house.findMany({
      where: { deletedAt: null, id: { in: targetIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { deletedAt: null, houseId: { in: targetIds } },
      select: {
        houseId: true,
        type: true,
        amount: true,
      },
    }),
    prisma.loan.findMany({
      where: { deletedAt: null, houseId: { in: targetIds } },
      select: {
        houseId: true,
        totalAmount: true,
        amountPaid: true,
      },
    }),
  ]);

  const houseStats: Record<
    number,
    { inflow: number; outflow: number; lent: number; recovered: number }
  > = {};

  transactions.forEach((t) => {
    if (!houseStats[t.houseId]) {
      houseStats[t.houseId] = {
        inflow: 0,
        outflow: 0,
        lent: 0,
        recovered: 0,
      };
    }
    const amt = Number(t.amount);
    if (t.type === "INFLOW") {
      houseStats[t.houseId].inflow += amt;
    } else {
      houseStats[t.houseId].outflow += amt;
    }
  });

  loans.forEach((l) => {
    if (l.houseId !== null && l.houseId !== undefined) {
      if (!houseStats[l.houseId]) {
        houseStats[l.houseId] = {
          inflow: 0,
          outflow: 0,
          lent: 0,
          recovered: 0,
        };
      }
      houseStats[l.houseId].lent += Number(l.totalAmount);
      houseStats[l.houseId].recovered += Number(l.amountPaid);
    }
  });

  let totalCurrentCash = 0;
  let totalInitialCash = 0;

  const housesWithBalances = houses.map((h) => {
    const stats = houseStats[h.id] || {
      inflow: 0,
      outflow: 0,
      lent: 0,
      recovered: 0,
    };
    const initCash = Number(h.initialCash);
    const currentCash =
      initCash + stats.inflow - stats.outflow - stats.lent + stats.recovered;

    totalInitialCash += initCash;
    totalCurrentCash += currentCash;

    return {
      id: h.id,
      userId: h.userId,
      name: h.name,
      address: h.address,
      initialCash: initCash,
      initialCashDate: h.initialCashDate,
      currentCash,
      totalInflow: stats.inflow,
      totalOutflow: stats.outflow,
      isOwner: h.userId === user.id,
      ownerName: h.user?.name || h.user?.email || "Family Member",
    };
  });

  housesWithBalances.sort((a, b) => {
    if (a.userId === user.id && b.userId !== user.id) return -1;
    if (a.userId !== user.id && b.userId === user.id) return 1;
    return a.id - b.id;
  });

  const result = {
    houses: housesWithBalances,
    totalCurrentCash,
    totalInitialCash,
  };

  cacheSet(cacheKey, result, 60000, ["houses", "transactions", "loans"]);
  return result;
}

export async function createHouseAction(formData: FormData) {
  const user = await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const initialCashStr = formData.get("initialCash") as string;
  const initialCash = initialCashStr ? parseFloat(initialCashStr) : 0;
  const initialCashDateStr = formData.get("initialCashDate") as string;
  const initialCashDate = initialCashDateStr
    ? new Date(initialCashDateStr)
    : new Date();

  if (!name) {
    return { error: "House name is required" };
  }

  await prisma.house.create({
    data: {
      userId: user.id,
      name,
      address,
      initialCash,
      initialCashDate,
    },
  });

  cacheInvalidateTag("houses");
  cacheInvalidateTag("dashboard");
  revalidatePath("/");
  revalidatePath("/houses");
  return { success: true };
}
