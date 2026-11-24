"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cacheGet, cacheSet, cacheInvalidateTag } from "@/lib/cache";
import { resolveTargetHouseIds } from "@/lib/house-query";
import type { Prisma } from "@prisma/client";
import {
  AnalyticsFilterParams,
  CashflowAnalyticsResponse,
  AnalyticsDataPoint,
  AnalyticsTransactionItem,
  CategoryAnalyticsItem,
  CategoryAnalyticsData,
  HouseAnalyticsItem,
  HouseAnalyticsSummary,
  RentalIncomeAnalyticsSummary,
  RentalUnitSummary,
  RentalMonthCell,
  SpendingCadenceAnalyticsResult,
  SpendingCadenceAvailableItem,
  ExtendedCategoryAnalytics,
  CadenceOccurrence,
  CadenceIntervalBucket,
  DayOfMonthCluster,
  DayOfWeekDistribution,
  MonthlySpendRunRate,
  SubTypeDecomposition,
  SpiritualGivingAnalyticsSummary,
  MonthlyGivingTrajectory,
  ShubhDenominationItem,
  SpiritualGivingPurpose,
  RawRentalTx,
  ResolvedRentalPayment,
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

  // Sort descending by total amount and take top 20
  const sorted = Array.from(map.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 20);

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

  const { targetIds, isAll, cacheKeySegment } =
    await resolveTargetHouseIds(houseId);

  const cacheKey = `analytics:${cacheKeySegment}:${range}:${startDate || ""}:${endDate || ""}`;
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
    // Look up earliest transaction with local memory caching
    const earliestCacheKey = "analytics:earliest_date";
    let earliestDate = cacheGet<string>(earliestCacheKey);
    if (!earliestDate) {
      const earliest = await prisma.transaction.findFirst({
        where: { deletedAt: null },
        orderBy: { dateOfAdd: "asc" },
        select: { dateOfAdd: true },
      });
      if (earliest?.dateOfAdd) {
        earliestDate = earliest.dateOfAdd.toISOString();
        cacheSet(earliestCacheKey, earliestDate, 60000, [
          "transactions",
          "analytics",
        ]);
      }
    }
    if (earliestDate) {
      computedStart = new Date(earliestDate);
      computedStart.setHours(0, 0, 0, 0);
    } else {
      computedStart = new Date(computedEnd.getFullYear(), 0, 1, 0, 0, 0, 0);
    }
  }

  // Build where filter: when isAll, include all non-deleted transactions across all houses
  const where: Prisma.TransactionWhereInput = {
    deletedAt: null,
    ...(isAll ? {} : { houseId: { in: targetIds } }),
    dateOfAdd: {
      gte: computedStart,
      lte: computedEnd,
    },
  };

  // Complete category scope across house(s) to ensure full, accurate category totals matching Transactions page
  const categoryWhere: Prisma.TransactionWhereInput = {
    deletedAt: null,
    ...(isAll ? {} : { houseId: { in: targetIds } }),
  };

  // Fetch timeline transactions and complete category transactions in parallel
  const [transactions, allCategoryTxs] = await Promise.all([
    prisma.transaction.findMany({
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
    }),
    prisma.transaction.findMany({
      where: categoryWhere,
      select: {
        category: true,
        amount: true,
        type: true,
      },
    }),
  ]);

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

  // Category Analytics Calculations (Complete category totals matching Transactions page)
  const rawTxList = allCategoryTxs.map((t) => ({
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

const HOUSE_PALETTE = [
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#14b8a6", // Teal
];

export async function getHouseAnalyticsData(
  selectedHouseId?: string | number
): Promise<HouseAnalyticsSummary> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      totalHouses: 0,
      totalPortfolioCash: 0,
      totalPortfolioInflow: 0,
      totalPortfolioOutflow: 0,
      netPortfolioFlow: 0,
      totalPortfolioLoans: 0,
      houses: [],
    };
  }

  const { targetIds, isAll, cacheKeySegment } =
    await resolveTargetHouseIds(selectedHouseId);

  const cacheKey = `analytics:houses:${cacheKeySegment}`;
  const cached = cacheGet<HouseAnalyticsSummary>(cacheKey);
  if (cached) return cached;

  // Fetch houses, non-deleted transactions, and loans based on target house IDs (never restricted by userId)
  const [houses, transactions, loans] = await Promise.all([
    prisma.house.findMany({
      where: {
        deletedAt: null,
        ...(isAll ? {} : { id: { in: targetIds } }),
      },
      select: {
        id: true,
        name: true,
        initialCash: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        deletedAt: null,
        ...(isAll ? {} : { houseId: { in: targetIds } }),
      },
      select: {
        id: true,
        houseId: true,
        type: true,
        amount: true,
        category: true,
      },
    }),
    prisma.loan.findMany({
      where: {
        deletedAt: null,
        ...(isAll ? {} : { houseId: { in: targetIds } }),
      },
      select: {
        houseId: true,
        totalAmount: true,
        amountPaid: true,
      },
    }),
  ]);

  // Aggregate loans by house
  const houseLoanMap = new Map<number, number>();
  let totalPortfolioLoans = 0;

  loans.forEach((loan) => {
    const outstanding = Math.max(
      0,
      Number(loan.totalAmount) - Number(loan.amountPaid)
    );
    totalPortfolioLoans += outstanding;
    if (loan.houseId) {
      houseLoanMap.set(
        loan.houseId,
        (houseLoanMap.get(loan.houseId) || 0) + outstanding
      );
    }
  });

  // Aggregate by house
  const houseMap = new Map<
    number,
    {
      inflow: number;
      outflow: number;
      inflowCount: number;
      outflowCount: number;
      inflowCategories: Map<string, number>;
      outflowCategories: Map<string, number>;
    }
  >();

  houses.forEach((h) => {
    houseMap.set(h.id, {
      inflow: 0,
      outflow: 0,
      inflowCount: 0,
      outflowCount: 0,
      inflowCategories: new Map(),
      outflowCategories: new Map(),
    });
  });

  let totalPortfolioInflow = 0;
  let totalPortfolioOutflow = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount);
    let hData = houseMap.get(tx.houseId);
    if (!hData) {
      hData = {
        inflow: 0,
        outflow: 0,
        inflowCount: 0,
        outflowCount: 0,
        inflowCategories: new Map(),
        outflowCategories: new Map(),
      };
      houseMap.set(tx.houseId, hData);
    }

    if (tx.type === "INFLOW") {
      hData.inflow += amt;
      hData.inflowCount++;
      totalPortfolioInflow += amt;
      const catKey = (tx.category || "Uncategorized").trim();
      hData.inflowCategories.set(
        catKey,
        (hData.inflowCategories.get(catKey) || 0) + amt
      );
    } else {
      hData.outflow += amt;
      hData.outflowCount++;
      totalPortfolioOutflow += amt;
      const catKey = (tx.category || "Uncategorized").trim();
      hData.outflowCategories.set(
        catKey,
        (hData.outflowCategories.get(catKey) || 0) + amt
      );
    }
  });

  const totalPortfolioFlow = totalPortfolioInflow + totalPortfolioOutflow;
  let totalInitialCash = 0;

  const houseItems: HouseAnalyticsItem[] = houses.map((h, idx) => {
    const initCash = Number(h.initialCash || 0);
    totalInitialCash += initCash;
    const data = houseMap.get(h.id) || {
      inflow: 0,
      outflow: 0,
      inflowCount: 0,
      outflowCount: 0,
      inflowCategories: new Map(),
      outflowCategories: new Map(),
    };

    const houseLoansDue = houseLoanMap.get(h.id) || 0;
    const netCashFlow = data.inflow - data.outflow;
    // Remove loans given to relatives from cash in hand
    const currentCashInHand = initCash + netCashFlow - houseLoansDue;

    // Find top categories
    let topInflowCat: { category: string; amount: number } | undefined;
    let maxInflow = 0;
    data.inflowCategories.forEach((amount, cat) => {
      if (amount > maxInflow) {
        maxInflow = amount;
        topInflowCat = { category: cat, amount };
      }
    });

    let topOutflowCat: { category: string; amount: number } | undefined;
    let maxOutflow = 0;
    data.outflowCategories.forEach((amount, cat) => {
      if (amount > maxOutflow) {
        maxOutflow = amount;
        topOutflowCat = { category: cat, amount };
      }
    });

    const houseTotalFlow = data.inflow + data.outflow;

    return {
      id: h.id,
      name: h.name,
      initialCash: initCash,
      totalInflow: data.inflow,
      totalOutflow: data.outflow,
      netCashFlow,
      currentCashInHand,
      inflowCount: data.inflowCount,
      outflowCount: data.outflowCount,
      inflowShare:
        totalPortfolioInflow > 0
          ? Number(((data.inflow / totalPortfolioInflow) * 100).toFixed(1))
          : 0,
      outflowShare:
        totalPortfolioOutflow > 0
          ? Number(((data.outflow / totalPortfolioOutflow) * 100).toFixed(1))
          : 0,
      totalFlowShare:
        totalPortfolioFlow > 0
          ? Number(((houseTotalFlow / totalPortfolioFlow) * 100).toFixed(1))
          : 0,
      topInflowCategory: topInflowCat,
      topOutflowCategory: topOutflowCat,
      outstandingLoans: houseLoansDue,
      color: HOUSE_PALETTE[idx % HOUSE_PALETTE.length],
    };
  });

  const netPortfolioFlow = totalPortfolioInflow - totalPortfolioOutflow;
  // Total portfolio cash in hand removes all relative loans disbursed
  const totalPortfolioCash =
    totalInitialCash + netPortfolioFlow - totalPortfolioLoans;

  const result: HouseAnalyticsSummary = {
    totalHouses: houses.length,
    totalPortfolioCash,
    totalPortfolioInflow,
    totalPortfolioOutflow,
    netPortfolioFlow,
    totalPortfolioLoans,
    houses: houseItems,
  };

  cacheSet(cacheKey, result, 60000, [
    "analytics",
    "transactions",
    "houses",
    "loans",
  ]);
  return result;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function normalizeRentalUnitName(rawTitle: string): string {
  let title = (rawTitle || "").trim();
  title = title
    .replace(/\s*[\(\[]\s*\d+(?:\s*,\s*\d+)*\s*[\)\]]/gi, "")
    .replace(/\s+rent\b.*$/i, "")
    .replace(/[-–—,:;]+$/g, "")
    .trim();
  return title || "Unassigned Unit";
}

function parseExplicitCoveredMonths(rawTitle: string): number[] | null {
  const match = (rawTitle || "").match(
    /[\(\[]\s*(\d{1,2}(?:\s*,\s*\d{1,2})*)\s*[\)\]]/
  );
  if (!match) return null;
  const parsed = match[1]
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((m) => m >= 1 && m <= 12);
  if (parsed.length === 0) return null;
  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

function resolveCoveredMonths(
  rawTitle: string,
  txDate: Date,
  amount: number,
  expectedMonthlyRent: number
): number[] {
  const explicit = parseExplicitCoveredMonths(rawTitle);
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  const txMonth = txDate.getUTCMonth() + 1;
  if (expectedMonthlyRent > 0 && amount > 0) {
    const ratio = Math.round(amount / expectedMonthlyRent);
    if (
      ratio >= 2 &&
      Math.abs(amount - ratio * expectedMonthlyRent) / expectedMonthlyRent < 0.2
    ) {
      const months: number[] = [];
      const start =
        txMonth + ratio - 1 <= 12 ? txMonth : Math.max(1, 13 - ratio);
      for (let i = 0; i < ratio; i++) {
        months.push(start + i);
      }
      return months;
    }
  }

  return [txMonth];
}

function computeExpectedMonthlyRent(rates: number[]): number {
  const positive = rates.filter((r) => r > 0);
  if (positive.length === 0) return 0;

  const freq = new Map<number, number>();
  let bestRate = positive[0];
  let maxCount = 0;

  positive.forEach((rate) => {
    const count = (freq.get(rate) || 0) + 1;
    freq.set(rate, count);
    if (count > maxCount) {
      maxCount = count;
      bestRate = rate;
    }
  });

  return bestRate;
}

export async function getRentalIncomeAnalyticsData(
  selectedYear?: number,
  filterHouseId?: number | string
): Promise<RentalIncomeAnalyticsSummary> {
  const user = await getCurrentUser();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const year = selectedYear || currentYear;

  const defaultEmptySummary: RentalIncomeAnalyticsSummary = {
    year,
    availableYears: [currentYear, 2025],
    units: [],
    totalAnnualCollected: 0,
    totalExpectedAnnualRent: 0,
    overallCollectionRate: 100,
    totalMissingMonths: 0,
    totalVacantMonths: 0,
    totalMultiMonthPayments: 0,
    overallOccupancyRate: 100,
    monthlyTotals: MONTH_NAMES.map((name, i) => ({
      month: i + 1,
      monthName: name,
      total: 0,
    })),
  };

  if (!user) {
    return defaultEmptySummary;
  }

  const { targetIds, isAll, cacheKeySegment } =
    await resolveTargetHouseIds(filterHouseId);

  const cacheKey = `rental_analytics:${year}:${cacheKeySegment}`;
  const cached = cacheGet<RentalIncomeAnalyticsSummary>(cacheKey);
  if (cached) return cached;

  // Query transactions based on target house IDs (never restricted by user.id so all family properties show when selected)
  const [allHistoricalRentalTx, vacancies] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        deletedAt: null,
        type: "INFLOW",
        category: { equals: "rental income", mode: "insensitive" },
        ...(isAll ? {} : { houseId: { in: targetIds } }),
      },
      select: {
        id: true,
        title: true,
        amount: true,
        dateOfAdd: true,
        houseId: true,
        house: { select: { id: true, name: true } },
      },
      orderBy: { dateOfAdd: "asc" },
    }),
    prisma.rentalVacancy.findMany({
      where: {
        year,
      },
    }),
  ]);

  const availableYearsSet = new Set<number>();
  availableYearsSet.add(currentYear);
  allHistoricalRentalTx.forEach((t) => {
    availableYearsSet.add(new Date(t.dateOfAdd).getFullYear());
  });
  const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);

  const vacancyMap = new Map<string, { isVacant: boolean; notes?: string }>();
  vacancies.forEach((v) => {
    vacancyMap.set(`${v.unitName}:${v.month}`, {
      isVacant: v.isVacant,
      notes: v.notes || undefined,
    });
  });

  const unitMetadataMap = new Map<
    string,
    {
      houseId?: number;
      houseName?: string;
      allTx: RawRentalTx[];
      yearTx: RawRentalTx[];
    }
  >();

  allHistoricalRentalTx.forEach((tx) => {
    const unitName = normalizeRentalUnitName(tx.title);
    let meta = unitMetadataMap.get(unitName);
    if (!meta) {
      meta = {
        houseId: tx.houseId,
        houseName: tx.house?.name,
        allTx: [],
        yearTx: [],
      };
      unitMetadataMap.set(unitName, meta);
    } else if (!meta.houseName && tx.house?.name) {
      meta.houseId = tx.houseId;
      meta.houseName = tx.house.name;
    }

    const txYear = new Date(tx.dateOfAdd).getFullYear();
    const rawTx: RawRentalTx = {
      id: tx.id,
      title: tx.title,
      amount: Number(tx.amount),
      date: new Date(tx.dateOfAdd),
      houseId: tx.houseId,
      houseName: tx.house?.name,
    };
    meta.allTx.push(rawTx);
    if (txYear === year) {
      meta.yearTx.push(rawTx);
    }
  });

  const unitExpectedRentMap = new Map<string, number>();

  unitMetadataMap.forEach((meta, unitName) => {
    const yearCandidateRates: number[] = [];
    const allCandidateRates: number[] = [];

    meta.yearTx.forEach((tx) => {
      const explicit = parseExplicitCoveredMonths(tx.title);
      if (explicit && explicit.length > 0) {
        yearCandidateRates.push(tx.amount / explicit.length);
      } else {
        yearCandidateRates.push(tx.amount);
      }
    });

    meta.allTx.forEach((tx) => {
      const explicit = parseExplicitCoveredMonths(tx.title);
      if (explicit && explicit.length > 0) {
        allCandidateRates.push(tx.amount / explicit.length);
      } else {
        allCandidateRates.push(tx.amount);
      }
    });

    const yearRate = computeExpectedMonthlyRent(yearCandidateRates);
    const overallRate = computeExpectedMonthlyRent(allCandidateRates);
    unitExpectedRentMap.set(unitName, yearRate || overallRate || 0);
  });

  const sortedUnitNames = Array.from(unitMetadataMap.keys()).sort();
  const unitSummaries: RentalUnitSummary[] = [];
  let totalAnnualCollected = 0;
  let totalMissingMonths = 0;
  let totalVacantMonths = 0;
  let totalMultiMonthPayments = 0;
  const monthlyTotalsArray = Array(12).fill(0);

  sortedUnitNames.forEach((unitName) => {
    const meta = unitMetadataMap.get(unitName)!;
    const expectedMonthlyRent = unitExpectedRentMap.get(unitName) || 0;

    const payments: ResolvedRentalPayment[] = meta.yearTx.map((tx) => {
      const covered = resolveCoveredMonths(
        tx.title,
        tx.date,
        tx.amount,
        expectedMonthlyRent
      );
      return {
        amount: tx.amount,
        txId: tx.id,
        txDate: tx.date.toISOString().slice(0, 10),
        txTitle: tx.title,
        coveredMonths: covered,
      };
    });

    const monthsCells: RentalMonthCell[] = [];
    let unitAnnualCollected = 0;
    let unitPaidCount = 0;
    let unitMissingCount = 0;
    let unitVacantCount = 0;
    let unitCombinedCount = 0;

    const coveredByMap = new Map<
      number,
      {
        primaryMonth: number;
        effectiveMonthly: number;
        totalAmount: number;
        txId: number;
        txDate: string;
        txTitle: string;
        allCovered: number[];
      }
    >();

    const primaryPaymentsMap = new Map<
      number,
      {
        amount: number;
        effectiveMonthly: number;
        txId: number;
        txDate: string;
        txTitle: string;
        coveredMonths: number[];
      }
    >();

    payments.forEach((p) => {
      const primaryMonth = p.coveredMonths[0] || 1;
      const effectiveMonthly =
        p.coveredMonths.length > 0
          ? p.amount / p.coveredMonths.length
          : p.amount;

      if (p.coveredMonths.length > 1) {
        unitCombinedCount++;
        totalMultiMonthPayments++;
      }

      primaryPaymentsMap.set(primaryMonth, {
        amount: p.amount,
        effectiveMonthly,
        txId: p.txId,
        txDate: p.txDate,
        txTitle: p.txTitle,
        coveredMonths: p.coveredMonths,
      });

      p.coveredMonths.slice(1).forEach((m) => {
        coveredByMap.set(m, {
          primaryMonth,
          effectiveMonthly,
          totalAmount: p.amount,
          txId: p.txId,
          txDate: p.txDate,
          txTitle: p.txTitle,
          allCovered: p.coveredMonths,
        });
      });
    });

    for (let m = 1; m <= 12; m++) {
      const monthName = MONTH_NAMES[m - 1];
      const vacKey = `${unitName}:${m}`;
      const vacInfo = vacancyMap.get(vacKey);

      if (vacInfo?.isVacant) {
        unitVacantCount++;
        totalVacantMonths++;
        monthsCells.push({
          month: m,
          monthName,
          status: "VACANT",
          amount: 0,
          effectiveMonthlyAmount: 0,
          isVacant: true,
          notes: vacInfo.notes,
        });
        continue;
      }

      const primary = primaryPaymentsMap.get(m);
      if (primary) {
        unitPaidCount++;
        unitAnnualCollected += primary.amount;
        monthlyTotalsArray[m - 1] += primary.amount;

        const isCombined = primary.coveredMonths.length > 1;
        monthsCells.push({
          month: m,
          monthName,
          status: isCombined ? "COMBINED_PRIMARY" : "PAID",
          amount: primary.amount,
          effectiveMonthlyAmount: primary.effectiveMonthly,
          transactionId: primary.txId,
          transactionDate: primary.txDate,
          transactionTitle: primary.txTitle,
          coveredMonths: primary.coveredMonths,
        });
        continue;
      }

      const covered = coveredByMap.get(m);
      if (covered) {
        unitPaidCount++;
        monthsCells.push({
          month: m,
          monthName,
          status: "COMBINED_COVERED",
          amount: 0,
          effectiveMonthlyAmount: covered.effectiveMonthly,
          transactionId: covered.txId,
          transactionDate: covered.txDate,
          transactionTitle: covered.txTitle,
          coveredByMonth: covered.primaryMonth,
          coveredMonths: covered.allCovered,
        });
        continue;
      }

      const isFuture =
        year > currentYear || (year === currentYear && m > currentMonth);
      if (isFuture) {
        monthsCells.push({
          month: m,
          monthName,
          status: "UPCOMING",
          amount: 0,
          effectiveMonthlyAmount: 0,
        });
        continue;
      }

      unitMissingCount++;
      totalMissingMonths++;
      monthsCells.push({
        month: m,
        monthName,
        status: "MISSING",
        amount: 0,
        effectiveMonthlyAmount: 0,
      });
    }

    const eligibleMonths = Math.max(0, 12 - unitVacantCount);
    const expectedAnnualRent = expectedMonthlyRent * eligibleMonths;
    const occupancyRate =
      eligibleMonths > 0
        ? Number(((unitPaidCount / eligibleMonths) * 100).toFixed(1))
        : 100;
    const collectionRate =
      expectedAnnualRent > 0
        ? Number(((unitAnnualCollected / expectedAnnualRent) * 100).toFixed(1))
        : 100;

    totalAnnualCollected += unitAnnualCollected;

    unitSummaries.push({
      unitName,
      houseId: meta.houseId,
      houseName: meta.houseName,
      months: monthsCells,
      annualCollected: unitAnnualCollected,
      expectedMonthlyRent,
      expectedAnnualRent,
      paidMonthsCount: unitPaidCount,
      missingMonthsCount: unitMissingCount,
      vacantMonthsCount: unitVacantCount,
      combinedPaymentsCount: unitCombinedCount,
      occupancyRate,
      collectionRate,
    });
  });

  const totalEligibleMonthsAcrossUnits = Math.max(
    1,
    unitSummaries.length * 12 - totalVacantMonths
  );
  const totalPaidMonthsAcrossUnits = unitSummaries.reduce(
    (acc, u) => acc + u.paidMonthsCount,
    0
  );
  const overallOccupancyRate = Number(
    (
      (totalPaidMonthsAcrossUnits / totalEligibleMonthsAcrossUnits) *
      100
    ).toFixed(1)
  );

  const totalExpectedAnnualRent = unitSummaries.reduce(
    (acc, u) => acc + u.expectedAnnualRent,
    0
  );
  const overallCollectionRate =
    totalExpectedAnnualRent > 0
      ? Number(
          ((totalAnnualCollected / totalExpectedAnnualRent) * 100).toFixed(1)
        )
      : 100;

  const result: RentalIncomeAnalyticsSummary = {
    year,
    availableYears,
    units: unitSummaries,
    totalAnnualCollected,
    totalExpectedAnnualRent,
    overallCollectionRate,
    totalMissingMonths,
    totalVacantMonths,
    totalMultiMonthPayments,
    overallOccupancyRate,
    monthlyTotals: MONTH_NAMES.map((name, i) => ({
      month: i + 1,
      monthName: name,
      total: monthlyTotalsArray[i],
    })),
  };

  cacheSet(cacheKey, result, ONE_DAY_MS, [
    "analytics",
    "transactions",
    "rental_analytics",
  ]);
  return result;
}

export async function toggleRentalVacancyAction({
  unitName,
  year,
  month,
  isVacant,
  notes,
}: {
  unitName: string;
  year: number;
  month: number;
  isVacant: boolean;
  notes?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  if (!isVacant) {
    await prisma.rentalVacancy.deleteMany({
      where: {
        userId: user.id,
        unitName,
        year,
        month,
      },
    });
  } else {
    await prisma.rentalVacancy.upsert({
      where: {
        userId_unitName_year_month: {
          userId: user.id,
          unitName,
          year,
          month,
        },
      },
      update: {
        isVacant: true,
        notes: notes || null,
      },
      create: {
        userId: user.id,
        unitName,
        year,
        month,
        isVacant: true,
        notes: notes || null,
      },
    });
  }

  cacheInvalidateTag("rental_analytics");
  cacheInvalidateTag("analytics");
  revalidatePath("/analytics");
  return { success: true };
}

function classifySubType(
  title: string,
  category: string
): "fuel" | "service" | "repair" | "care" | "insurance" | "general" {
  const text = `${title} ${category}`.toLowerCase();
  if (/diesel|petrol|fuel|refill|gas/i.test(text)) return "fuel";
  if (/service|servicing|maintenance|oil change/i.test(text)) return "service";
  if (/toing|towing|repair|accident|puncture|breakdown|mechanic/i.test(text))
    return "repair";
  if (/wash|cleaning|clean|detail|polish/i.test(text)) return "care";
  if (/insurance|policy|rto|tax|apply charge/i.test(text)) return "insurance";
  return "general";
}

export async function getSpendingCadenceAvailableItems(
  houseId?: string | number
): Promise<SpendingCadenceAvailableItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { targetIds, isAll, cacheKeySegment } =
    await resolveTargetHouseIds(houseId);
  const cacheKey = `cadence:items:${cacheKeySegment}`;
  const cached = cacheGet<SpendingCadenceAvailableItem[]>(cacheKey);
  if (cached) return cached;

  const houseFilter = isAll ? {} : { houseId: { in: targetIds } };

  // Concurrently fetch Black Kia stats, White Kia stats, and top categories in one parallel wave
  const [kiaCount, kiaSum, whiteKiaCount, whiteKiaSum, categories] =
    await Promise.all([
      prisma.transaction.count({
        where: {
          type: "OUTFLOW",
          deletedAt: null,
          ...houseFilter,
          OR: [
            { title: { contains: "Black Kia", mode: "insensitive" } },
            { title: { contains: "Kia", mode: "insensitive" } },
          ],
        },
      }),
      prisma.transaction.aggregate({
        where: {
          type: "OUTFLOW",
          deletedAt: null,
          ...houseFilter,
          OR: [
            { title: { contains: "Black Kia", mode: "insensitive" } },
            { title: { contains: "Kia", mode: "insensitive" } },
          ],
        },
        _sum: { amount: true },
      }),
      prisma.transaction.count({
        where: {
          type: "OUTFLOW",
          deletedAt: null,
          ...houseFilter,
          title: { contains: "White Kia", mode: "insensitive" },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          type: "OUTFLOW",
          deletedAt: null,
          ...houseFilter,
          title: { contains: "White Kia", mode: "insensitive" },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["category"],
        where: {
          type: "OUTFLOW",
          deletedAt: null,
          ...houseFilter,
        },
        _count: { _all: true },
        _sum: { amount: true },
        orderBy: { _count: { category: "desc" } },
        take: 12,
      }),
    ]);

  const items: SpendingCadenceAvailableItem[] = [];

  if (kiaCount > 0) {
    items.push({
      id: "black-kia",
      label: "Black Kia Diesel",
      category: "diesel",
      count: kiaCount,
      totalSpent: Number(kiaSum._sum?.amount || 0),
      isFeatured: true,
    });
  }

  if (whiteKiaCount > 0) {
    items.push({
      id: "white-kia",
      label: "White Kia Petrol",
      category: "diesel",
      count: whiteKiaCount,
      totalSpent: Number(whiteKiaSum._sum?.amount || 0),
      isFeatured: true,
    });
  }

  for (const cat of categories) {
    if (cat.category.toLowerCase() === "diesel") continue;
    items.push({
      id: `cat:${cat.category}`,
      label: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      category: cat.category,
      count: cat._count?._all || 0,
      totalSpent: Number(cat._sum?.amount || 0),
    });
  }

  cacheSet(cacheKey, items, 30000, ["analytics", "transactions"]);
  return items;
}

const EMPTY_EXTENDED_INTELLIGENCE: ExtendedCategoryAnalytics = {
  velocity: {
    currentMonthTotal: 0,
    daysElapsedInMonth: 1,
    totalDaysInMonth: 30,
    currentDailyBurnRate: 0,
    projectedMonthEndSpend: 0,
    baselineMonthlySpend: 0,
    velocityPacingPercentage: 0,
    status: "CADENCE_ESTIMATED",
    mode: "CADENCE_ESTIMATED",
    cadenceExpectedMonthly: 0,
    cadenceIntervalDays: 0,
  },
  volatility: {
    standardDeviation: 0,
    meanAmount: 0,
    coefficientOfVariation: 0,
    classification: "ELASTIC",
    fixedBaselineAmount: 0,
    volatilityScore: 0,
  },
  anomalies: [],
  pareto: {
    topDrivers: [],
    tailSpendTotal: 0,
    tailSpendPercentage: 0,
    tailSpendCount: 0,
    top20PercentSpendShare: 0,
  },
  temporalHeatmap: [],
  microBleed: {
    threshold: 1000,
    totalBleedAmount: 0,
    totalBleedCount: 0,
    percentageOfCategoryTotal: 0,
    topMicroTitles: [],
  },
};

function computeExtendedCategoryAnalytics(
  transactions: {
    id: number;
    amount: number | string | Prisma.Decimal;
    title: string;
    dateOfAdd: Date;
  }[],
  totalSpent: number,
  medianAmount: number,
  averageIntervalDays: number = 0
): ExtendedCategoryAnalytics {
  if (transactions.length === 0) return EMPTY_EXTENDED_INTELLIGENCE;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysElapsedInMonth = Math.max(1, now.getDate());

  // 1. Velocity & Burn Pacing
  let currentMonthTotal = 0;
  const monthlyTotalsMap = new Map<string, number>();

  transactions.forEach((tx) => {
    const val = Number(tx.amount);
    const d = new Date(tx.dateOfAdd);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyTotalsMap.set(ym, (monthlyTotalsMap.get(ym) || 0) + val);

    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      currentMonthTotal += val;
    }
  });

  // Baseline monthly spend from previous historical months
  const previousMonthsTotals: number[] = [];
  monthlyTotalsMap.forEach((amt, ym) => {
    const [y, m] = ym.split("-").map(Number);
    if (y < currentYear || (y === currentYear && m - 1 < currentMonth)) {
      previousMonthsTotals.push(amt);
    }
  });

  let baselineMonthlySpend = 0;
  if (previousMonthsTotals.length > 0) {
    previousMonthsTotals.sort((a, b) => a - b);
    baselineMonthlySpend =
      previousMonthsTotals[Math.floor(previousMonthsTotals.length / 2)];
  } else {
    baselineMonthlySpend =
      currentMonthTotal > 0
        ? currentMonthTotal
        : Math.round(totalSpent / Math.max(1, monthlyTotalsMap.size));
  }

  // Cadence Expected Monthly Run-Rate
  const cadenceExpectedMonthly =
    averageIntervalDays > 0
      ? Math.round((30.4 / averageIntervalDays) * medianAmount)
      : baselineMonthlySpend;

  let currentDailyBurnRate = 0;
  let projectedMonthEndSpend = 0;
  let velocityPacingPercentage = 0;
  let pacingStatus:
    "SLOW" | "NORMAL" | "ACCELERATED" | "OVERHEATING" | "CADENCE_ESTIMATED" =
    "NORMAL";
  let mode: "LIVE_MTD" | "CADENCE_ESTIMATED" = "LIVE_MTD";

  if (currentMonthTotal > 0) {
    // Current month has recorded transactions: compute live MTD pacing
    mode = "LIVE_MTD";
    currentDailyBurnRate = Math.round(currentMonthTotal / daysElapsedInMonth);
    projectedMonthEndSpend = currentDailyBurnRate * totalDaysInMonth;

    if (baselineMonthlySpend > 0) {
      velocityPacingPercentage = Math.round(
        ((projectedMonthEndSpend - baselineMonthlySpend) /
          baselineMonthlySpend) *
          100
      );
    }

    if (velocityPacingPercentage > 35) pacingStatus = "OVERHEATING";
    else if (velocityPacingPercentage > 12) pacingStatus = "ACCELERATED";
    else if (velocityPacingPercentage < -15) pacingStatus = "SLOW";
    else pacingStatus = "NORMAL";
  } else {
    // Current month has 0 transactions so far: apply Smart Cadence Fallback
    mode = "CADENCE_ESTIMATED";
    pacingStatus = "CADENCE_ESTIMATED";
    projectedMonthEndSpend =
      cadenceExpectedMonthly > 0
        ? cadenceExpectedMonthly
        : baselineMonthlySpend;
    currentDailyBurnRate = Math.round(projectedMonthEndSpend / 30.4);

    if (baselineMonthlySpend > 0 && projectedMonthEndSpend > 0) {
      velocityPacingPercentage = Math.round(
        ((projectedMonthEndSpend - baselineMonthlySpend) /
          baselineMonthlySpend) *
          100
      );
    }
  }

  // 2. Volatility & Predictability Classification
  const n = transactions.length;
  const meanAmount = n > 0 ? totalSpent / n : 0;
  let varianceSum = 0;
  transactions.forEach((tx) => {
    const diff = Number(tx.amount) - meanAmount;
    varianceSum += diff * diff;
  });
  const standardDeviation = n > 1 ? Math.sqrt(varianceSum / n) : 0;
  const coefficientOfVariation =
    meanAmount > 0 ? Number((standardDeviation / meanAmount).toFixed(2)) : 0;

  let classification: "FIXED" | "ELASTIC" | "WILDCARD" = "ELASTIC";
  if (coefficientOfVariation < 0.35) classification = "FIXED";
  else if (coefficientOfVariation > 0.85) classification = "WILDCARD";

  const volatilityScore = Math.min(
    100,
    Math.round(coefficientOfVariation * 100)
  );
  const fixedBaselineAmount =
    classification === "FIXED"
      ? Math.round(medianAmount)
      : Math.round(meanAmount * 0.7);

  // 3. Statistical Anomalies (Z-score & Outlier Detection)
  const anomalies: ExtendedCategoryAnalytics["anomalies"] = [];
  transactions.forEach((tx) => {
    const val = Number(tx.amount);
    const zScore =
      standardDeviation > 0
        ? Number(((val - meanAmount) / standardDeviation).toFixed(2))
        : 0;
    const multiplierVsMedian =
      medianAmount > 0 ? Number((val / medianAmount).toFixed(1)) : 1;
    if (zScore >= 1.75 || (multiplierVsMedian >= 2.2 && val > 1500)) {
      anomalies.push({
        id: tx.id,
        title: tx.title,
        amount: val,
        date: tx.dateOfAdd.toISOString().split("T")[0],
        zScore,
        multiplierVsMedian,
        isFlagged: true,
      });
    }
  });
  anomalies.sort((a, b) => b.amount - a.amount);
  const topAnomalies = anomalies.slice(0, 5);

  // 4. Pareto 80/20 Driver Analysis
  const titleMap = new Map<string, { total: number; count: number }>();
  transactions.forEach((tx) => {
    const cleanTitle = (tx.title || "General Outflow").trim();
    const curr = titleMap.get(cleanTitle) || { total: 0, count: 0 };
    curr.total += Number(tx.amount);
    curr.count += 1;
    titleMap.set(cleanTitle, curr);
  });

  const sortedTitles = Array.from(titleMap.entries())
    .map(([name, data]) => ({
      name,
      amount: data.total,
      count: data.count,
      percentage:
        totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  let runningCum = 0;
  const topDrivers = sortedTitles.slice(0, 4).map((d) => {
    runningCum += d.amount;
    return {
      name: d.name,
      amount: d.amount,
      percentage: d.percentage,
      cumulativePercentage:
        totalSpent > 0 ? Math.round((runningCum / totalSpent) * 100) : 0,
      transactionCount: d.count,
    };
  });

  const topDriversTotal = topDrivers.reduce((acc, d) => acc + d.amount, 0);
  const tailSpendTotal = Math.max(0, totalSpent - topDriversTotal);
  const tailSpendPercentage =
    totalSpent > 0 ? Math.round((tailSpendTotal / totalSpent) * 100) : 0;
  const tailSpendCount = Math.max(
    0,
    n - topDrivers.reduce((acc, d) => acc + d.transactionCount, 0)
  );

  const sortedTxAmounts = transactions
    .map((t) => Number(t.amount))
    .sort((a, b) => b - a);
  const top20Count = Math.max(1, Math.ceil(n * 0.2));
  const top20Sum = sortedTxAmounts
    .slice(0, top20Count)
    .reduce((acc, v) => acc + v, 0);
  const top20PercentSpendShare =
    totalSpent > 0 ? Math.round((top20Sum / totalSpent) * 100) : 0;

  // 5. Temporal Day-of-Week & Decade Heatmap (7 days x 3 decades)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const decades: ("EARLY" | "MID" | "LATE")[] = ["EARLY", "MID", "LATE"];

  const heatCellsMap = new Map<string, { amount: number; count: number }>();
  for (let dow = 0; dow < 7; dow++) {
    for (const dec of decades) {
      heatCellsMap.set(`${dow}_${dec}`, { amount: 0, count: 0 });
    }
  }

  transactions.forEach((tx) => {
    const d = new Date(tx.dateOfAdd);
    const dow = d.getDay();
    const dayOfMonth = d.getDate();
    const dec: "EARLY" | "MID" | "LATE" =
      dayOfMonth <= 10 ? "EARLY" : dayOfMonth <= 20 ? "MID" : "LATE";
    const key = `${dow}_${dec}`;
    const cell = heatCellsMap.get(key) || { amount: 0, count: 0 };
    cell.amount += Number(tx.amount);
    cell.count += 1;
    heatCellsMap.set(key, cell);
  });

  let maxCellAmount = 0;
  heatCellsMap.forEach((v) => {
    if (v.amount > maxCellAmount) maxCellAmount = v.amount;
  });

  const temporalHeatmap: ExtendedCategoryAnalytics["temporalHeatmap"] = [];
  for (let dow = 0; dow < 7; dow++) {
    for (const dec of decades) {
      const data = heatCellsMap.get(`${dow}_${dec}`) || { amount: 0, count: 0 };
      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (data.amount > 0 && maxCellAmount > 0) {
        const ratio = data.amount / maxCellAmount;
        if (ratio >= 0.75) intensity = 4;
        else if (ratio >= 0.5) intensity = 3;
        else if (ratio >= 0.25) intensity = 2;
        else intensity = 1;
      }
      temporalHeatmap.push({
        dayOfWeek: dow,
        dayName: dayNames[dow],
        decade: dec,
        amount: data.amount,
        count: data.count,
        intensity,
      });
    }
  }

  // 6. Micro-Outflow Bleed Tracker (Spends <= ₹1,000)
  const microThreshold = 1000;
  const microTxs = transactions.filter(
    (t) => Number(t.amount) <= microThreshold
  );
  const totalBleedAmount = microTxs.reduce(
    (acc, t) => acc + Number(t.amount),
    0
  );
  const totalBleedCount = microTxs.length;
  const percentageOfCategoryTotal =
    totalSpent > 0 ? Math.round((totalBleedAmount / totalSpent) * 100) : 0;

  const microTitleMap = new Map<string, { count: number; total: number }>();
  microTxs.forEach((t) => {
    const cleanTitle = (t.title || "Quick Spend").trim();
    const curr = microTitleMap.get(cleanTitle) || { count: 0, total: 0 };
    curr.count += 1;
    curr.total += Number(t.amount);
    microTitleMap.set(cleanTitle, curr);
  });

  const topMicroTitles = Array.from(microTitleMap.entries())
    .map(([title, d]) => ({ title, count: d.count, total: d.total }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    velocity: {
      currentMonthTotal,
      daysElapsedInMonth,
      totalDaysInMonth,
      currentDailyBurnRate,
      projectedMonthEndSpend,
      baselineMonthlySpend,
      velocityPacingPercentage,
      status: pacingStatus,
      mode,
      cadenceExpectedMonthly,
      cadenceIntervalDays: averageIntervalDays,
    },
    volatility: {
      standardDeviation,
      meanAmount,
      coefficientOfVariation,
      classification,
      fixedBaselineAmount,
      volatilityScore,
    },
    anomalies: topAnomalies,
    pareto: {
      topDrivers,
      tailSpendTotal,
      tailSpendPercentage,
      tailSpendCount,
      top20PercentSpendShare,
    },
    temporalHeatmap,
    microBleed: {
      threshold: microThreshold,
      totalBleedAmount,
      totalBleedCount,
      percentageOfCategoryTotal,
      topMicroTitles,
    },
  };
}

export async function getItemSpendingCadenceAnalytics(
  queryKey: string = "black-kia",
  houseId?: string | number
): Promise<SpendingCadenceAnalyticsResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      queryKey,
      queryLabel: "Unauthorized",
      totalSpent: 0,
      totalOccurrences: 0,
      averageAmount: 0,
      medianAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      averageIntervalDays: 0,
      medianIntervalDays: 0,
      minIntervalDays: 0,
      maxIntervalDays: 0,
      regularityScore: 0,
      predictedNextOccurrenceDate: null,
      predictedNextAmount: 0,
      firstOccurrenceDate: "",
      lastOccurrenceDate: "",
      occurrences: [],
      intervalBuckets: [],
      dayOfMonthClusters: [],
      dayOfWeekDistribution: [],
      monthlyRunRates: [],
      subTypeBreakdown: [],
      anomaliesCount: 0,
      extendedIntelligence: EMPTY_EXTENDED_INTELLIGENCE,
    };
  }

  const { targetIds, isAll, cacheKeySegment } =
    await resolveTargetHouseIds(houseId);

  const cacheKey = `cadence:${cacheKeySegment}:${queryKey}`;
  const cached = cacheGet<SpendingCadenceAnalyticsResult>(cacheKey);
  if (cached) return cached;

  const whereClause: Prisma.TransactionWhereInput = {
    type: "OUTFLOW",
    deletedAt: null,
    ...(isAll ? {} : { houseId: { in: targetIds } }),
  };

  let queryLabel = "Black Kia Diesel";

  if (queryKey === "black-kia") {
    whereClause.OR = [
      { title: { contains: "Black Kia", mode: "insensitive" } },
      { title: { contains: "Kia", mode: "insensitive" } },
    ];
    queryLabel = "Black Kia Diesel";
  } else if (queryKey === "white-kia") {
    whereClause.title = { contains: "White Kia", mode: "insensitive" };
    queryLabel = "White Kia Petrol";
  } else if (queryKey.startsWith("cat:")) {
    const catName = queryKey.replace("cat:", "");
    whereClause.category = { equals: catName, mode: "insensitive" };
    queryLabel = catName.charAt(0).toUpperCase() + catName.slice(1);
  } else {
    whereClause.OR = [
      { category: { contains: queryKey, mode: "insensitive" } },
      { title: { contains: queryKey, mode: "insensitive" } },
    ];
    queryLabel = queryKey;
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { dateOfAdd: "asc" },
    include: { house: { select: { name: true } } },
  });

  if (transactions.length === 0) {
    const emptyResult: SpendingCadenceAnalyticsResult = {
      queryKey,
      queryLabel,
      totalSpent: 0,
      totalOccurrences: 0,
      averageAmount: 0,
      medianAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      averageIntervalDays: 0,
      medianIntervalDays: 0,
      minIntervalDays: 0,
      maxIntervalDays: 0,
      regularityScore: 0,
      predictedNextOccurrenceDate: null,
      predictedNextAmount: 0,
      firstOccurrenceDate: "",
      lastOccurrenceDate: "",
      occurrences: [],
      intervalBuckets: [],
      dayOfMonthClusters: [],
      dayOfWeekDistribution: [],
      monthlyRunRates: [],
      subTypeBreakdown: [],
      anomaliesCount: 0,
      extendedIntelligence: EMPTY_EXTENDED_INTELLIGENCE,
    };
    cacheSet(cacheKey, emptyResult, 30000, ["analytics", "transactions"]);
    return emptyResult;
  }

  let totalSpent = 0;
  const amounts = transactions.map((t) => {
    const val = Number(t.amount);
    totalSpent += val;
    return val;
  });

  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const minAmount = sortedAmounts[0];
  const maxAmount = sortedAmounts[sortedAmounts.length - 1];
  const medianAmount = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
  const averageAmount = Math.round(totalSpent / transactions.length);

  // Compute intervals between consecutive transactions
  const intervals: number[] = [];
  let cumulative = 0;
  const occurrences: CadenceOccurrence[] = [];
  let anomaliesCount = 0;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const amt = Number(tx.amount);
    cumulative += amt;

    let daysSincePrevious: number | null = null;
    if (i > 0) {
      const prevDate = new Date(transactions[i - 1].dateOfAdd).getTime();
      const currDate = new Date(tx.dateOfAdd).getTime();
      daysSincePrevious = Math.max(
        0,
        Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24))
      );
      intervals.push(daysSincePrevious);
    }

    const subType = classifySubType(tx.title, tx.category);

    // Anomaly checks
    let isAnomaly = false;
    let anomalyReason: string | undefined;

    if (amt >= 2.5 * medianAmount && amt > 5000) {
      isAnomaly = true;
      anomalyReason = `High amount spike (₹${amt.toLocaleString("en-IN")})`;
      anomaliesCount++;
    } else if (
      daysSincePrevious !== null &&
      daysSincePrevious <= 1 &&
      amt >= 2000
    ) {
      isAnomaly = true;
      anomalyReason = "Clustered spend within 24-48h";
      anomaliesCount++;
    }

    occurrences.push({
      id: tx.id,
      date: tx.dateOfAdd.toISOString().split("T")[0],
      amount: amt,
      title: tx.title,
      category: tx.category,
      houseId: tx.houseId,
      houseName: tx.house.name,
      daysSincePrevious,
      cumulativeTotal: cumulative,
      isAnomaly,
      anomalyReason,
      subType,
    });
  }

  // Interval stats
  let averageIntervalDays = 0;
  let medianIntervalDays = 0;
  let minIntervalDays = 0;
  let maxIntervalDays = 0;
  let regularityScore = 0;

  if (intervals.length > 0) {
    const sortedIntervals = [...intervals].sort((a, b) => a - b);
    minIntervalDays = sortedIntervals[0];
    maxIntervalDays = sortedIntervals[sortedIntervals.length - 1];
    medianIntervalDays =
      sortedIntervals[Math.floor(sortedIntervals.length / 2)];
    const sumIntervals = intervals.reduce((acc, v) => acc + v, 0);
    averageIntervalDays =
      Math.round((sumIntervals / intervals.length) * 10) / 10;

    const variance =
      intervals.reduce(
        (acc, v) => acc + Math.pow(v - averageIntervalDays, 2),
        0
      ) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = averageIntervalDays > 0 ? stdDev / averageIntervalDays : 1;
    regularityScore = Math.max(
      10,
      Math.min(98, Math.round((1 - Math.min(1, cv * 0.7)) * 100))
    );
  }

  // Predict Next Occurrence
  const lastTxDate = new Date(transactions[transactions.length - 1].dateOfAdd);
  let predictedNextOccurrenceDate: string | null = null;
  if (averageIntervalDays > 0) {
    const nextDate = new Date(
      lastTxDate.getTime() + averageIntervalDays * 24 * 60 * 60 * 1000
    );
    predictedNextOccurrenceDate = nextDate.toISOString().split("T")[0];
  }

  const recent3 = amounts.slice(-3);
  const predictedNextAmount =
    recent3.length > 0
      ? Math.round(recent3.reduce((a, b) => a + b, 0) / recent3.length)
      : medianAmount;

  // Interval Buckets
  const bucketRanges = [
    { label: "1-5d", min: 0, max: 5 },
    { label: "6-10d", min: 6, max: 10 },
    { label: "11-15d", min: 11, max: 15 },
    { label: "16-20d", min: 16, max: 20 },
    { label: "21d+", min: 21, max: Infinity },
  ];
  const intervalBuckets: CadenceIntervalBucket[] = bucketRanges.map((b) => {
    const count = intervals.filter((d) => d >= b.min && d <= b.max).length;
    const percentage =
      intervals.length > 0 ? Math.round((count / intervals.length) * 100) : 0;
    return { label: b.label, count, percentage };
  });

  // Day-of-Month Clusters
  let dec1Count = 0,
    dec1Amount = 0;
  let dec2Count = 0,
    dec2Amount = 0;
  let dec3Count = 0,
    dec3Amount = 0;

  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayOfWeekAmounts = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthlyMap = new Map<string, { amount: number; count: number }>();

  const subTypeMap = new Map<
    string,
    { count: number; total: number; color: string; label: string }
  >();
  const subTypeColors: Record<string, { color: string; label: string }> = {
    fuel: { color: "#10b981", label: "Fuel Refills" },
    service: { color: "#f59e0b", label: "Service & Maintenance" },
    repair: { color: "#f43f5e", label: "Repairs & Towing" },
    care: { color: "#06b6d4", label: "Wash & Detailing" },
    insurance: { color: "#8b5cf6", label: "Insurance & Admin" },
    general: { color: "#64748b", label: "General Outflow" },
  };

  for (const tx of transactions) {
    const d = new Date(tx.dateOfAdd);
    const day = d.getDate();
    const dow = d.getDay();
    const amt = Number(tx.amount);

    if (day <= 10) {
      dec1Count++;
      dec1Amount += amt;
    } else if (day <= 20) {
      dec2Count++;
      dec2Amount += amt;
    } else {
      dec3Count++;
      dec3Amount += amt;
    }

    dayOfWeekCounts[dow]++;
    dayOfWeekAmounts[dow] += amt;

    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const curr = monthlyMap.get(ym) || { amount: 0, count: 0 };
    curr.amount += amt;
    curr.count += 1;
    monthlyMap.set(ym, curr);

    const st = classifySubType(tx.title, tx.category);
    const stEntry = subTypeMap.get(st) || {
      count: 0,
      total: 0,
      color: subTypeColors[st]?.color || "#64748b",
      label: subTypeColors[st]?.label || st,
    };
    stEntry.count++;
    stEntry.total += amt;
    subTypeMap.set(st, stEntry);
  }

  const dayOfMonthClusters: DayOfMonthCluster[] = [
    {
      decade: "1st - 10th",
      count: dec1Count,
      totalAmount: dec1Amount,
      percentage:
        totalSpent > 0 ? Math.round((dec1Amount / totalSpent) * 100) : 0,
    },
    {
      decade: "11th - 20th",
      count: dec2Count,
      totalAmount: dec2Amount,
      percentage:
        totalSpent > 0 ? Math.round((dec2Amount / totalSpent) * 100) : 0,
    },
    {
      decade: "21st - 31st",
      count: dec3Count,
      totalAmount: dec3Amount,
      percentage:
        totalSpent > 0 ? Math.round((dec3Amount / totalSpent) * 100) : 0,
    },
  ];

  const dayOfWeekDistribution: DayOfWeekDistribution[] = dayNames.map(
    (name, i) => ({
      dayName: name,
      count: dayOfWeekCounts[i],
      totalAmount: dayOfWeekAmounts[i],
    })
  );

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyRunRates: MonthlySpendRunRate[] = Array.from(
    monthlyMap.entries()
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, data]) => {
      const [year, month] = ym.split("-");
      const label = `${monthNames[parseInt(month, 10) - 1]} ${year.slice(2)}`;
      return {
        yearMonth: ym,
        label,
        amount: data.amount,
        count: data.count,
      };
    });

  const subTypeBreakdown: SubTypeDecomposition[] = Array.from(
    subTypeMap.entries()
  ).map(([key, data]) => ({
    subType: key,
    label: data.label,
    count: data.count,
    totalAmount: data.total,
    percentage:
      totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0,
    color: data.color,
  }));

  const extendedIntelligence = computeExtendedCategoryAnalytics(
    transactions,
    totalSpent,
    medianAmount,
    averageIntervalDays
  );

  const result: SpendingCadenceAnalyticsResult = {
    queryKey,
    queryLabel,
    totalSpent,
    totalOccurrences: transactions.length,
    averageAmount,
    medianAmount,
    minAmount,
    maxAmount,
    averageIntervalDays,
    medianIntervalDays,
    minIntervalDays,
    maxIntervalDays,
    regularityScore,
    predictedNextOccurrenceDate,
    predictedNextAmount,
    firstOccurrenceDate: transactions[0].dateOfAdd.toISOString().split("T")[0],
    lastOccurrenceDate: transactions[transactions.length - 1].dateOfAdd
      .toISOString()
      .split("T")[0],
    occurrences: occurrences.reverse(),
    intervalBuckets,
    dayOfMonthClusters,
    dayOfWeekDistribution,
    monthlyRunRates,
    subTypeBreakdown,
    anomaliesCount,
    extendedIntelligence,
  };

  cacheSet(cacheKey, result, 30000, ["analytics", "transactions"]);
  return result;
}

const EMPTY_SPIRITUAL_ANALYTICS: SpiritualGivingAnalyticsSummary = {
  totalSpiritualOutflow: 0,
  totalEventsCount: 0,
  givingRatioOfOutflow: 0,
  givingRatioOfInflow: 0,
  bhogTotal: 0,
  bhogCount: 0,
  bhogPercentage: 0,
  donationTotal: 0,
  donationCount: 0,
  donationPercentage: 0,
  averageDonationTicket: 0,
  medianTicketSize: 0,
  activeGivingStreakMonths: 0,
  festiveOutflowTotal: 0,
  festiveOutflowPercentage: 0,
  routineOutflowTotal: 0,
  monthlyTrajectory: [],
  shubhDenominations: [],
  purposeBreakdown: [],
  recentGivingEvents: [],
};

function isAuspiciousAmount(amt: number): boolean {
  if (amt === 111111 || amt === 108 || amt === 1008) return true;
  if (amt % 100 === 1 || amt % 1000 === 100) return true;
  if ([501, 1001, 1100, 2100, 5100, 11000, 21000, 51000, 101000].includes(amt))
    return true;
  if (amt >= 1000 && amt % 1000 === 0) return true;
  if (amt >= 500 && amt % 500 === 0) return true;
  return false;
}

export async function getSpiritualGivingAnalytics(
  houseId?: string | number
): Promise<SpiritualGivingAnalyticsSummary> {
  const user = await getCurrentUser();
  if (!user) {
    return EMPTY_SPIRITUAL_ANALYTICS;
  }

  const { targetIds, isAll, cacheKeySegment } =
    await resolveTargetHouseIds(houseId);

  const cacheKey = `spiritual:${cacheKeySegment}`;
  const cached = cacheGet<SpiritualGivingAnalyticsSummary>(cacheKey);
  if (cached) return cached;

  const whereClause: Prisma.TransactionWhereInput = {
    deletedAt: null,
    type: "OUTFLOW",
    OR: [
      { category: { equals: "bhog", mode: "insensitive" } },
      { category: { equals: "donation", mode: "insensitive" } },
    ],
    ...(isAll ? {} : { houseId: { in: targetIds } }),
  };

  const [spiritualTxs, totalOutflowAgg, totalInflowAgg] = await Promise.all([
    prisma.transaction.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        category: true,
        amount: true,
        dateOfAdd: true,
        houseId: true,
      },
      orderBy: { dateOfAdd: "asc" },
    }),
    prisma.transaction.aggregate({
      where: {
        deletedAt: null,
        type: "OUTFLOW",
        ...(isAll ? {} : { houseId: { in: targetIds } }),
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        deletedAt: null,
        type: "INFLOW",
        ...(isAll ? {} : { houseId: { in: targetIds } }),
      },
      _sum: { amount: true },
    }),
  ]);

  if (spiritualTxs.length === 0) {
    cacheSet(cacheKey, EMPTY_SPIRITUAL_ANALYTICS, 30000, [
      "analytics",
      "transactions",
    ]);
    return EMPTY_SPIRITUAL_ANALYTICS;
  }

  const totalPortfolioOutflow = totalOutflowAgg._sum.amount
    ? Number(totalOutflowAgg._sum.amount)
    : 0;
  const totalPortfolioInflow = totalInflowAgg._sum.amount
    ? Number(totalInflowAgg._sum.amount)
    : 0;

  let totalSpiritualOutflow = 0;
  let bhogTotal = 0;
  let bhogCount = 0;
  let donationTotal = 0;
  let donationCount = 0;
  let festiveOutflowTotal = 0;

  const amounts: number[] = [];
  const monthlyMap = new Map<
    string,
    { bhog: number; donation: number; total: number; count: number }
  >();

  // Purpose buckets
  let annadanamTotal = 0;
  let annadanamCount = 0;
  let templeTrustTotal = 0;
  let templeTrustCount = 0;
  let jivaDayaTotal = 0;
  let jivaDayaCount = 0;
  let socialAidTotal = 0;
  let socialAidCount = 0;
  let generalDaanTotal = 0;
  let generalDaanCount = 0;

  // Shubh buckets
  const shubhBuckets = {
    mahaDaan: {
      label: "₹1,11,111 (Maha Daan)",
      count: 0,
      total: 0,
      min: 111111,
      max: 111111,
    },
    tier1: {
      label: "₹20,000 - ₹50,000 (Major Seva)",
      count: 0,
      total: 0,
      min: 20000,
      max: 50000,
    },
    tier2: {
      label: "₹10,000 - ₹19,999 (Annadanam/Katha)",
      count: 0,
      total: 0,
      min: 10000,
      max: 19999,
    },
    tier3: {
      label: "₹5,000 - ₹9,999 (Monthly Seva Trust)",
      count: 0,
      total: 0,
      min: 5000,
      max: 9999,
    },
    tier4: {
      label: "₹1,000 - ₹4,999 (Ritual Offerings)",
      count: 0,
      total: 0,
      min: 1000,
      max: 4999,
    },
    tier5: {
      label: "< ₹1,000 (Dakshina & Daily Puja)",
      count: 0,
      total: 0,
      min: 0,
      max: 999,
    },
  };

  const festiveMonths = [2, 7, 8, 9, 10]; // Mar (Chaitra), Aug (Shravan), Sep (Ganesh/Navratri), Oct (Diwali), Nov (Annakut)

  for (const tx of spiritualTxs) {
    const amt = Number(tx.amount);
    totalSpiritualOutflow += amt;
    amounts.push(amt);

    const isBhog = tx.category.toLowerCase().includes("bhog");
    if (isBhog) {
      bhogTotal += amt;
      bhogCount++;
    } else {
      donationTotal += amt;
      donationCount++;
    }

    const d = new Date(tx.dateOfAdd);
    if (festiveMonths.includes(d.getMonth())) {
      festiveOutflowTotal += amt;
    }

    // Monthly aggregation
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const curr = monthlyMap.get(ym) || {
      bhog: 0,
      donation: 0,
      total: 0,
      count: 0,
    };
    if (isBhog) {
      curr.bhog += amt;
    } else {
      curr.donation += amt;
    }
    curr.total += amt;
    curr.count++;
    monthlyMap.set(ym, curr);

    // Purpose decomposition
    const titleLower = tx.title.toLowerCase();
    if (
      /bhojan|nasto|dinner|lunch|caterer|food|prasad|farshan|gundi|gathiya|mango|tiffin|bhandara/.test(
        titleLower
      )
    ) {
      annadanamTotal += amt;
      annadanamCount++;
    } else if (
      /om shanti|trust|sitaram|mandir|temple|raja deva|tithi|katha|shiv/.test(
        titleLower
      )
    ) {
      templeTrustTotal += amt;
      templeTrustCount++;
    } else if (/cow|grass|gau|bird|chan|animal|pashu/.test(titleLower)) {
      jivaDayaTotal += amt;
      jivaDayaCount++;
    } else if (
      /children|girls|boys|office boys|student|shradhanjali|aid|school/.test(
        titleLower
      )
    ) {
      socialAidTotal += amt;
      socialAidCount++;
    } else {
      generalDaanTotal += amt;
      generalDaanCount++;
    }

    // Shubh bucket assignment
    if (amt >= 111111) {
      shubhBuckets.mahaDaan.count++;
      shubhBuckets.mahaDaan.total += amt;
    } else if (amt >= 20000) {
      shubhBuckets.tier1.count++;
      shubhBuckets.tier1.total += amt;
    } else if (amt >= 10000) {
      shubhBuckets.tier2.count++;
      shubhBuckets.tier2.total += amt;
    } else if (amt >= 5000) {
      shubhBuckets.tier3.count++;
      shubhBuckets.tier3.total += amt;
    } else if (amt >= 1000) {
      shubhBuckets.tier4.count++;
      shubhBuckets.tier4.total += amt;
    } else {
      shubhBuckets.tier5.count++;
      shubhBuckets.tier5.total += amt;
    }
  }

  // Median ticket size
  amounts.sort((a, b) => a - b);
  const medianTicketSize =
    amounts.length > 0
      ? amounts.length % 2 === 0
        ? Math.round(
            (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2
          )
        : amounts[Math.floor(amounts.length / 2)]
      : 0;

  const averageDonationTicket =
    spiritualTxs.length > 0
      ? Math.round(totalSpiritualOutflow / spiritualTxs.length)
      : 0;

  const givingRatioOfOutflow =
    totalPortfolioOutflow > 0
      ? Math.round((totalSpiritualOutflow / totalPortfolioOutflow) * 1000) / 10
      : 0;

  const givingRatioOfInflow =
    totalPortfolioInflow > 0
      ? Math.round((totalSpiritualOutflow / totalPortfolioInflow) * 1000) / 10
      : 0;

  const bhogPercentage =
    totalSpiritualOutflow > 0
      ? Math.round((bhogTotal / totalSpiritualOutflow) * 100)
      : 0;
  const donationPercentage =
    totalSpiritualOutflow > 0
      ? Math.round((donationTotal / totalSpiritualOutflow) * 100)
      : 0;

  const routineOutflowTotal = Math.max(
    0,
    totalSpiritualOutflow - festiveOutflowTotal
  );
  const festiveOutflowPercentage =
    totalSpiritualOutflow > 0
      ? Math.round((festiveOutflowTotal / totalSpiritualOutflow) * 100)
      : 0;

  // Monthly trajectory
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const sortedMonths = Array.from(monthlyMap.keys()).sort();
  const monthlyTrajectory: MonthlyGivingTrajectory[] = sortedMonths.map(
    (ym) => {
      const data = monthlyMap.get(ym)!;
      const [y, m] = ym.split("-");
      const label = `${monthNames[parseInt(m, 10) - 1]} '${y.slice(2)}`;
      return {
        yearMonth: ym,
        label,
        bhogAmount: data.bhog,
        donationAmount: data.donation,
        totalAmount: data.total,
        eventCount: data.count,
      };
    }
  );

  // Active giving streak (longest consecutive calendar months)
  let maxStreak = 0;
  let currentStreak = 0;
  if (sortedMonths.length > 0) {
    maxStreak = 1;
    currentStreak = 1;
    for (let i = 1; i < sortedMonths.length; i++) {
      const [prevY, prevM] = sortedMonths[i - 1].split("-").map(Number);
      const [currY, currM] = sortedMonths[i].split("-").map(Number);
      const diffMonths = (currY - prevY) * 12 + (currM - prevM);
      if (diffMonths === 1) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 1;
      }
    }
  }

  // Shubh denominations
  const shubhDenominations: ShubhDenominationItem[] = Object.values(
    shubhBuckets
  )
    .filter((b) => b.count > 0)
    .map((b) => ({
      amount: b.total,
      label: b.label,
      count: b.count,
      total: b.total,
      percentage:
        totalSpiritualOutflow > 0
          ? Math.round((b.total / totalSpiritualOutflow) * 100)
          : 0,
    }));

  // Purpose breakdown
  const rawPurposes = [
    {
      purpose: "ANNADANAM" as const,
      label: "Annadanam & Prasad Bhojan",
      amount: annadanamTotal,
      count: annadanamCount,
      color: "#F59E0B",
    },
    {
      purpose: "TEMPLE_TRUST" as const,
      label: "Temple & Spiritual Trusts",
      amount: templeTrustTotal,
      count: templeTrustCount,
      color: "#818CF8",
    },
    {
      purpose: "JIVA_DAYA" as const,
      label: "Jiva Daya & Gau Seva",
      amount: jivaDayaTotal,
      count: jivaDayaCount,
      color: "#10B981",
    },
    {
      purpose: "SOCIAL_AID" as const,
      label: "Social Aid & Community",
      amount: socialAidTotal,
      count: socialAidCount,
      color: "#EC4899",
    },
    {
      purpose: "GENERAL_DAAN" as const,
      label: "Sacred Rituals & Offerings",
      amount: generalDaanTotal,
      count: generalDaanCount,
      color: "#06B6D4",
    },
  ];

  const purposeBreakdown: SpiritualGivingPurpose[] = rawPurposes
    .filter((p) => p.count > 0)
    .map((p) => ({
      ...p,
      percentage:
        totalSpiritualOutflow > 0
          ? Math.round((p.amount / totalSpiritualOutflow) * 100)
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Recent 6 giving events
  const recentGivingEvents = [...spiritualTxs]
    .sort(
      (a, b) =>
        new Date(b.dateOfAdd).getTime() - new Date(a.dateOfAdd).getTime()
    )
    .slice(0, 6)
    .map((tx) => ({
      id: tx.id,
      title: tx.title,
      category: tx.category,
      amount: Number(tx.amount),
      date: tx.dateOfAdd.toISOString().split("T")[0],
      isShubh: isAuspiciousAmount(Number(tx.amount)),
    }));

  const result: SpiritualGivingAnalyticsSummary = {
    totalSpiritualOutflow,
    totalEventsCount: spiritualTxs.length,
    givingRatioOfOutflow,
    givingRatioOfInflow,
    bhogTotal,
    bhogCount,
    bhogPercentage,
    donationTotal,
    donationCount,
    donationPercentage,
    averageDonationTicket,
    medianTicketSize,
    activeGivingStreakMonths: maxStreak,
    festiveOutflowTotal,
    festiveOutflowPercentage,
    routineOutflowTotal,
    monthlyTrajectory,
    shubhDenominations,
    purposeBreakdown,
    recentGivingEvents,
  };

  cacheSet(cacheKey, result, 30000, ["analytics", "transactions"]);
  return result;
}
