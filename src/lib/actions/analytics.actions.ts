"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cacheGet, cacheSet } from "@/lib/cache";
import {
  AnalyticsFilterParams,
  CashflowAnalyticsResponse,
  AnalyticsDataPoint,
  AnalyticsTransactionItem,
  CategoryAnalyticsItem,
  CategoryAnalyticsData,
} from "@/types/analytics.types";

function formatPointLabel(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${yy}`;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildCategoryAnalyticsData(
  txList: {
    category: string;
    amount: number;
    type: "INFLOW" | "OUTFLOW";
  }[],
  typeFilter?: "INFLOW" | "OUTFLOW"
): CategoryAnalyticsData {
  const filtered = typeFilter
    ? txList.filter((t) => t.type === typeFilter)
    : txList;
  const map = new Map<
    string,
    {
      total: number;
      count: number;
      inflowTotal: number;
      outflowTotal: number;
      type: "INFLOW" | "OUTFLOW";
    }
  >();

  filtered.forEach((t) => {
    const rawCat = (t.category || "Uncategorized").trim();
    const key = rawCat.toLowerCase();
    const existing = map.get(key) || {
      total: 0,
      count: 0,
      inflowTotal: 0,
      outflowTotal: 0,
      type: t.type,
    };
    existing.total += t.amount;
    existing.count += 1;
    if (t.type === "INFLOW") {
      existing.inflowTotal += t.amount;
    } else {
      existing.outflowTotal += t.amount;
    }
    existing.type =
      existing.inflowTotal >= existing.outflowTotal ? "INFLOW" : "OUTFLOW";
    map.set(key, existing);
  });

  const totalCatAmount = Array.from(map.values()).reduce(
    (sum, v) => sum + v.total,
    0
  );

  // Sort descending by total amount
  const sorted = Array.from(map.entries()).sort(
    (a, b) => b[1].total - a[1].total
  );

  const items: CategoryAnalyticsItem[] = sorted.map(([key, val], idx) => {
    const formattedName = key
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    const pct = totalCatAmount > 0 ? (val.total / totalCatAmount) * 100 : 0;
    const isTop = idx === 0 && val.total > 0;
    const isLowest = idx === sorted.length - 1 && sorted.length > 1;

    // Inflow: emerald green (#10b981), Outflow: coral/rose red (#f43f5e)
    const color = val.type === "INFLOW" ? "#10b981" : "#f43f5e";

    return {
      category: formattedName,
      type: val.type,
      totalAmount: val.total,
      percentage: Number(pct.toFixed(2)),
      transactionCount: val.count,
      avgTransactionAmount: Math.round(val.total / val.count),
      rank: idx + 1,
      isTop,
      isLowest,
      color,
    };
  });

  const avgAmount =
    items.length > 0 ? Math.round(totalCatAmount / items.length) : 0;
  const avgPct = items.length > 0 ? Number((100 / items.length).toFixed(2)) : 0;

  return {
    items,
    averageAmount: avgAmount,
    averagePercentage: avgPct,
    totalCategoryAmount: totalCatAmount,
    categoryCount: items.length,
  };
}

export async function getCashflowAnalytics(
  params: AnalyticsFilterParams = {}
): Promise<CashflowAnalyticsResponse> {
  const emptyCategoryData: CategoryAnalyticsData = {
    items: [],
    averageAmount: 0,
    averagePercentage: 0,
    totalCategoryAmount: 0,
    categoryCount: 0,
  };

  const user = await getCurrentUser();
  if (!user) {
    return {
      points: [],
      summary: {
        totalInflow: 0,
        totalOutflow: 0,
        netCashFlow: 0,
        inflowTransactionCount: 0,
        outflowTransactionCount: 0,
        dataPointCount: 0,
        startDate: "",
        endDate: "",
      },
      categories: {
        inflow: emptyCategoryData,
        outflow: emptyCategoryData,
        combined: emptyCategoryData,
      },
    };
  }

  const { houseId, range = "1Y", startDate, endDate } = params;

  const cacheKey = `analytics:${user.id}:${houseId || "all"}:${range}:${startDate || ""}:${endDate || ""}`;
  const cached = cacheGet<CashflowAnalyticsResponse>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  let computedEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  let computedStart = new Date(computedEnd);

  if (range === "3M") {
    computedStart.setMonth(computedStart.getMonth() - 3);
  } else if (range === "6M") {
    computedStart.setMonth(computedStart.getMonth() - 6);
  } else if (range === "1Y") {
    computedStart.setFullYear(computedStart.getFullYear() - 1);
  } else if (range === "2Y") {
    computedStart.setFullYear(computedStart.getFullYear() - 2);
  } else if (range === "3Y") {
    computedStart.setFullYear(computedStart.getFullYear() - 3);
  } else if (range === "CUSTOM" && startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      computedStart = new Date(
        s.getFullYear(),
        s.getMonth(),
        s.getDate(),
        0,
        0,
        0,
        0
      );
      computedEnd = new Date(
        e.getFullYear(),
        e.getMonth(),
        e.getDate(),
        23,
        59,
        59,
        999
      );
    }
  } else if (range === "ALL") {
    // Look up earliest transaction
    const earliest = await prisma.transaction.findFirst({
      where: { deletedAt: null },
      orderBy: { dateOfAdd: "asc" },
      select: { dateOfAdd: true },
    });
    if (earliest?.dateOfAdd) {
      computedStart = new Date(earliest.dateOfAdd);
      computedStart.setHours(0, 0, 0, 0);
    } else {
      computedStart = new Date(computedEnd.getFullYear(), 0, 1, 0, 0, 0, 0);
    }
  }

  // Build where filter
  const where: any = {
    deletedAt: null,
    dateOfAdd: {
      gte: computedStart,
      lte: computedEnd,
    },
  };

  if (houseId && houseId !== "ALL") {
    const hId = typeof houseId === "number" ? houseId : parseInt(houseId, 10);
    if (!isNaN(hId)) {
      where.houseId = hId;
    }
  }

  // Fetch transactions with selective projection
  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      id: true,
      type: true,
      amount: true,
      title: true,
      category: true,
      dateOfAdd: true,
      house: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { dateOfAdd: "asc" },
  });

  // Group transactions by YYYY-MM-DD
  const txByDate = new Map<string, AnalyticsTransactionItem[]>();
  let totalInflow = 0;
  let totalOutflow = 0;
  let inflowTxCount = 0;
  let outflowTxCount = 0;

  transactions.forEach((tx) => {
    const dStr = toISODate(new Date(tx.dateOfAdd));
    const amt = Number(tx.amount);
    const item: AnalyticsTransactionItem = {
      id: tx.id,
      type: tx.type,
      title: tx.title,
      amount: amt,
      category: tx.category,
      houseName: tx.house?.name,
    };

    if (!txByDate.has(dStr)) {
      txByDate.set(dStr, []);
    }
    txByDate.get(dStr)!.push(item);

    if (tx.type === "INFLOW") {
      totalInflow += amt;
      inflowTxCount++;
    } else {
      totalOutflow += amt;
      outflowTxCount++;
    }
  });

  // Generate continuous date points from computedStart to computedEnd
  const points: AnalyticsDataPoint[] = [];
  let cumInflow = 0;
  let cumOutflow = 0;

  const cur = new Date(computedStart);
  cur.setHours(0, 0, 0, 0);
  const endLimit = new Date(computedEnd);
  endLimit.setHours(0, 0, 0, 0);

  // Determine step size if range is large to prevent over-rendering
  const totalDays = Math.max(
    1,
    Math.round((endLimit.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24))
  );
  const stepDays = totalDays > 730 ? 3 : totalDays > 365 ? 2 : 1;

  while (cur <= endLimit) {
    const dStr = toISODate(cur);
    const dayTxs = txByDate.get(dStr) || [];

    let dayInflow = 0;
    let dayOutflow = 0;
    dayTxs.forEach((t) => {
      if (t.type === "INFLOW") dayInflow += t.amount;
      else dayOutflow += t.amount;
    });

    cumInflow += dayInflow;
    cumOutflow += dayOutflow;

    const hasInflow = dayTxs.some((t) => t.type === "INFLOW");
    const hasOutflow = dayTxs.some((t) => t.type === "OUTFLOW");

    points.push({
      date: dStr,
      label: formatPointLabel(cur),
      inflow: dayInflow,
      outflow: dayOutflow,
      cumulativeInflow: cumInflow,
      cumulativeOutflow: cumOutflow,
      netFlow: cumInflow - cumOutflow,
      hasInflow,
      hasOutflow,
      transactions: dayTxs,
    });

    cur.setDate(cur.getDate() + stepDays);
  }

  // Ensure last point is included if loop stepped past endLimit
  const lastDateStr = toISODate(endLimit);
  if (points.length === 0 || points[points.length - 1].date !== lastDateStr) {
    const dayTxs = txByDate.get(lastDateStr) || [];
    let dayInflow = 0;
    let dayOutflow = 0;
    dayTxs.forEach((t) => {
      if (t.type === "INFLOW") dayInflow += t.amount;
      else dayOutflow += t.amount;
    });
    cumInflow += dayInflow;
    cumOutflow += dayOutflow;
    points.push({
      date: lastDateStr,
      label: formatPointLabel(endLimit),
      inflow: dayInflow,
      outflow: dayOutflow,
      cumulativeInflow: cumInflow,
      cumulativeOutflow: cumOutflow,
      netFlow: cumInflow - cumOutflow,
      hasInflow: dayTxs.some((t) => t.type === "INFLOW"),
      hasOutflow: dayTxs.some((t) => t.type === "OUTFLOW"),
      transactions: dayTxs,
    });
  }

  // Category Analytics Calculations
  const rawTxList = transactions.map((t) => ({
    category: t.category,
    amount: Number(t.amount),
    type: t.type,
  }));

  const outflowCatData = buildCategoryAnalyticsData(rawTxList, "OUTFLOW");
  const inflowCatData = buildCategoryAnalyticsData(rawTxList, "INFLOW");
  const combinedCatData = buildCategoryAnalyticsData(rawTxList);

  const response: CashflowAnalyticsResponse = {
    points,
    summary: {
      totalInflow,
      totalOutflow,
      netCashFlow: totalInflow - totalOutflow,
      inflowTransactionCount: inflowTxCount,
      outflowTransactionCount: outflowTxCount,
      dataPointCount: points.length,
      startDate: toISODate(computedStart),
      endDate: toISODate(computedEnd),
    },
    categories: {
      inflow: inflowCatData,
      outflow: outflowCatData,
      combined: combinedCatData,
    },
  };

  cacheSet(cacheKey, response, 60000, ["analytics", "transactions"]);
  return response;
}
