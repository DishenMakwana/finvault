"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cacheGet, cacheSet, cacheInvalidateTag } from "@/lib/cache";
import { resolveTargetHouseIds } from "@/lib/house-query";
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
  CadenceOccurrence,
  CadenceIntervalBucket,
  DayOfMonthCluster,
  DayOfWeekDistribution,
  MonthlySpendRunRate,
  SubTypeDecomposition,
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

  // Build where filter: when isAll, include all non-deleted transactions across all houses
  const where: any = {
    deletedAt: null,
    ...(isAll ? {} : { houseId: { in: targetIds } }),
    dateOfAdd: {
      gte: computedStart,
      lte: computedEnd,
    },
  };

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

  interface RawTx {
    id: number;
    title: string;
    amount: number;
    date: Date;
    houseId?: number;
    houseName?: string;
  }

  const unitMetadataMap = new Map<
    string,
    {
      houseId?: number;
      houseName?: string;
      allTx: RawTx[];
      yearTx: RawTx[];
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
    const rawTx: RawTx = {
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

  interface ResolvedPayment {
    amount: number;
    txId: number;
    txDate: string;
    txTitle: string;
    coveredMonths: number[];
  }

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

    const payments: ResolvedPayment[] = meta.yearTx.map((tx) => {
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

  // 1. Check Black Kia count & total across target house(s) (never restricted by userId)
  const [kiaCount, kiaSum] = await Promise.all([
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
  ]);

  // 2. Check White Kia count & total across target house(s) (never restricted by userId)
  const [whiteKiaCount, whiteKiaSum] = await Promise.all([
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
  ]);

  // 3. Top categories with outflow transactions across target house(s) (never restricted by userId)
  const categories = await prisma.transaction.groupBy({
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
  });

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
    };
  }

  const { targetIds, isAll, cacheKeySegment } =
    await resolveTargetHouseIds(houseId);

  const cacheKey = `cadence:${cacheKeySegment}:${queryKey}`;
  const cached = cacheGet<SpendingCadenceAnalyticsResult>(cacheKey);
  if (cached) return cached;

  const whereClause: any = {
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
  };

  cacheSet(cacheKey, result, 30000, ["analytics", "transactions"]);
  return result;
}
