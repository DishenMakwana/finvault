"use server";

import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma, TransactionType } from "@prisma/client";
import { cacheGet, cacheSet, cacheInvalidateTag } from "@/lib/cache";
import {
  TransactionFilterOptions,
  TransactionTableItem,
  SyncStats,
} from "@/types/transactions.types";
import {
  getSearchTokens,
  scoreTransactionAgainstTokens,
} from "@/helpers/search";
import { MatchScoreResult, SearchableField } from "@/types/search.types";
import { parseExcelDate, formatToDateStr } from "@/lib/formatters";
import {
  CashflowChartDataPoint,
  CashflowTimeframe,
  DashboardSummaryResult,
} from "@/types/dashboard.types";
import { resolveTargetHouseIds } from "@/lib/house-query";
import { ActionResponse } from "@/types/ui.types";

function invalidateCashflowCaches() {
  cacheInvalidateTag("categories");
  cacheInvalidateTag("dashboard");
  cacheInvalidateTag("transactions");
  cacheInvalidateTag("houses");
  cacheInvalidateTag("analytics");
}

export async function getUniqueCategories(
  type?: "INFLOW" | "OUTFLOW"
): Promise<string[]> {
  const cacheKey = `categories:${type || "all"}`;
  const cached = cacheGet<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const where: Prisma.TransactionWhereInput = { deletedAt: null };
    if (type) {
      where.type = type;
    }

    const records = await prisma.transaction.findMany({
      where,
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    const dbCategories = records
      .map((r) => r.category?.trim())
      .filter((c): c is string => Boolean(c) && c.toLowerCase() !== "other");

    const uniqueMap = new Map<string, string>();
    dbCategories.forEach((cat) => {
      const key = cat.toLowerCase();
      if (!uniqueMap.has(key)) {
        // Format with title case
        const formatted = cat
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        uniqueMap.set(key, formatted);
      }
    });

    // If database already contains unique categories, return them dynamically
    if (uniqueMap.size > 0) {
      const result = Array.from(uniqueMap.values()).sort((a, b) =>
        a.localeCompare(b)
      );
      cacheSet(cacheKey, result, 60000, ["categories"]);
      return result;
    }

    // Default starter categories only when database has 0 transactions recorded yet
    const defaults =
      type === "INFLOW"
        ? ["Rent", "Salary", "Bonus", "Upad", "Business", "Interest", "Gift"]
        : type === "OUTFLOW"
          ? [
              "Medical",
              "Vehicle",
              "Groceries",
              "Utility Bills",
              "Education",
              "Maintenance",
              "Shopping",
              "Travel",
            ]
          : [
              "Rent",
              "Salary",
              "Bonus",
              "Upad",
              "Business",
              "Medical",
              "Vehicle",
              "Groceries",
              "Utility Bills",
              "Education",
              "Maintenance",
              "Shopping",
              "Travel",
            ];

    const sortedDefaults = defaults.sort((a, b) => a.localeCompare(b));
    cacheSet(cacheKey, sortedDefaults, 60000, ["categories"]);
    return sortedDefaults;
  } catch (error) {
    console.error("Error fetching categories from database:", error);
    return ["Groceries", "Medical", "Rent", "Salary", "Vehicle"];
  }
}

export async function addTransactionAction(
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireAuth();

  const houseIdStr = formData.get("houseId") as string;
  const houseId = parseInt(houseIdStr, 10);
  const type = formData.get("type") as TransactionType;
  const amountStr = formData.get("amount") as string;
  const title = (formData.get("title") as string)?.trim();
  const desc = (formData.get("desc") as string)?.trim() || null;
  const categoryRaw = (formData.get("category") as string)?.trim();
  const customCategory = (formData.get("customCategory") as string)?.trim();

  let category = categoryRaw;
  if ((!category || category.toLowerCase() === "other") && customCategory) {
    category = customCategory;
  }
  const normalizedCategory = category ? category.trim().toLowerCase() : "";
  const dateOfAddStr = formData.get("dateOfAdd") as string;
  const dateOfAdd = dateOfAddStr ? new Date(dateOfAddStr) : new Date();

  if (isNaN(houseId) || !type || !amountStr || !title || !normalizedCategory) {
    return {
      success: false,
      error:
        "Please provide all required fields (House, Type, Amount, Title, Category).",
    };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: "Amount must be a positive number." };
  }

  // Verify house exists
  const house = await prisma.house.findFirst({
    where: { id: houseId, deletedAt: null },
  });

  if (!house) {
    return { success: false, error: "Selected house does not exist." };
  }

  await prisma.transaction.create({
    data: {
      userId: user.id,
      houseId,
      type,
      amount,
      title,
      desc,
      category: normalizedCategory,
      dateOfAdd,
    },
  });

  invalidateCashflowCaches();
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}

export async function getTransactions(
  filters: TransactionFilterOptions = {}
): Promise<TransactionTableItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { targetIds, cacheKeySegment } = await resolveTargetHouseIds(
    filters.houseId
  );
  const cacheKey = `transactions:${user.id}:${cacheKeySegment}:${JSON.stringify(filters)}`;
  const cached = cacheGet<TransactionTableItem[]>(cacheKey);
  if (cached) return cached;

  const whereClause: Prisma.TransactionWhereInput = {
    houseId: { in: targetIds },
    deletedAt: null,
  };

  if (filters.type && filters.type !== "ALL") {
    whereClause.type = filters.type as TransactionType;
  }

  if (filters.category && filters.category !== "ALL") {
    const cats = Array.isArray(filters.category)
      ? filters.category.map((c) => c.trim().toLowerCase()).filter(Boolean)
      : filters.category
          .split(",")
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean);
    if (cats.length === 1) {
      whereClause.category = cats[0];
    } else if (cats.length > 1) {
      whereClause.category = { in: cats };
    }
  }

  if (filters.startDate || filters.endDate) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    whereClause.dateOfAdd = dateFilter;
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    const amountFilter: Prisma.DecimalFilter = {};
    if (filters.minAmount !== undefined) amountFilter.gte = filters.minAmount;
    if (filters.maxAmount !== undefined) amountFilter.lte = filters.maxAmount;
    whereClause.amount = amountFilter;
  }

  if (filters.flaggedOnly || filters.isFlagged !== undefined) {
    whereClause.isFlagged =
      filters.isFlagged !== undefined ? filters.isFlagged : true;
  }

  // Database-level search optimization: push search tokens directly into PostgreSQL query
  if (filters.search) {
    const tokens = getSearchTokens(filters.search);
    if (tokens.length > 0) {
      whereClause.AND = tokens.map((token) => ({
        OR: [
          { title: { contains: token, mode: "insensitive" } },
          { desc: { contains: token, mode: "insensitive" } },
          { category: { contains: token, mode: "insensitive" } },
          { house: { name: { contains: token, mode: "insensitive" } } },
        ],
      }));
    }
  }

  // Database-level sorting optimization: map sortBy & sortOrder directly into query
  let orderByClause: Prisma.TransactionOrderByWithRelationInput[] = [];
  if (filters.sortBy) {
    const dir = filters.sortOrder === "asc" ? "asc" : "desc";
    switch (filters.sortBy) {
      case "date":
        orderByClause = [{ dateOfAdd: dir }, { id: dir }];
        break;
      case "amount":
        orderByClause = [{ amount: dir }, { dateOfAdd: "desc" }];
        break;
      case "title":
        orderByClause = [{ title: dir }, { dateOfAdd: "desc" }];
        break;
      case "category":
        orderByClause = [{ category: dir }, { dateOfAdd: "desc" }];
        break;
      case "type":
        orderByClause = [{ type: dir }, { dateOfAdd: "desc" }];
        break;
      case "house":
        orderByClause = [{ house: { name: dir } }, { dateOfAdd: "desc" }];
        break;
      default:
        orderByClause = [{ dateOfAdd: dir }, { id: dir }];
    }
  } else {
    orderByClause = [
      { dateOfAdd: "desc" },
      { createdAt: "desc" },
      { id: "desc" },
    ];
  }

  // Select only required columns in query
  let transactions = await prisma.transaction.findMany({
    where: whereClause,
    select: {
      id: true,
      type: true,
      amount: true,
      title: true,
      desc: true,
      category: true,
      dateOfAdd: true,
      createdAt: true,
      houseId: true,
      isFlagged: true,
      house: {
        select: { id: true, name: true },
      },
    },
    orderBy: orderByClause,
  });

  // Relevance ranking when search query is active without explicit column sorting
  if (filters.search && !filters.sortBy) {
    const tokens = getSearchTokens(filters.search);
    if (tokens.length > 0) {
      const scored: {
        item: (typeof transactions)[0];
        score: MatchScoreResult;
      }[] = [];
      for (const t of transactions) {
        const fields: SearchableField[] = [
          { type: "TITLE", value: t.title || "" },
          { type: "CATEGORY", value: t.category || "" },
          { type: "HOUSE", value: t.house?.name || "" },
          { type: "DESCRIPTION", value: t.desc || "" },
          { type: "TYPE", value: t.type || "" },
        ];
        const res = scoreTransactionAgainstTokens(fields, tokens);
        scored.push({ item: t, score: res });
      }

      scored.sort((a, b) => {
        if (b.score.matchedTermsCount !== a.score.matchedTermsCount) {
          return b.score.matchedTermsCount - a.score.matchedTermsCount;
        }
        if (Math.abs(b.score.totalScore - a.score.totalScore) > 0.05) {
          return b.score.totalScore - a.score.totalScore;
        }
        return 0;
      });

      transactions = scored.map((s) => s.item);
    }
  }

  const result = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
  }));

  cacheSet(cacheKey, result, 60000, ["transactions"]);
  return result;
}

export async function softDeleteTransactionAction(id: number | string) {
  const user = await requireAuth();

  const txId = typeof id === "number" ? id : parseInt(id, 10);
  await prisma.transaction.updateMany({
    where: { id: txId, userId: user.id },
    data: { deletedAt: new Date() },
  });

  invalidateCashflowCaches();
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}

export async function toggleTransactionFlagAction(
  id: number | string,
  targetFlag?: boolean
) {
  const user = await requireAuth();

  const txId = typeof id === "number" ? id : parseInt(id, 10);
  const existing = await prisma.transaction.findFirst({
    where: { id: txId, userId: user.id },
    select: { id: true, isFlagged: true },
  });

  if (!existing) return { error: "Transaction not found" };

  const newFlagStatus =
    targetFlag !== undefined ? targetFlag : !existing.isFlagged;

  const updated = await prisma.transaction.update({
    where: { id: txId },
    data: { isFlagged: newFlagStatus },
    select: { id: true, isFlagged: true },
  });

  invalidateCashflowCaches();
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true, isFlagged: updated.isFlagged };
}

export async function updateTransactionAction(formData: FormData) {
  await requireAuth();

  const idStr = formData.get("id") as string;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return { error: "Invalid transaction ID." };

  const houseIdStr = formData.get("houseId") as string;
  const houseId = parseInt(houseIdStr, 10);
  const type = formData.get("type") as TransactionType;
  const amountStr = formData.get("amount") as string;
  const title = (formData.get("title") as string)?.trim();
  const desc = (formData.get("desc") as string)?.trim() || null;
  const categoryRaw = (formData.get("category") as string)?.trim();
  const customCategory = (formData.get("customCategory") as string)?.trim();

  let category = categoryRaw;
  if ((!category || category.toLowerCase() === "other") && customCategory) {
    category = customCategory;
  }
  const normalizedCategory = category ? category.trim().toLowerCase() : "";
  const dateOfAddStr = formData.get("dateOfAdd") as string;
  const dateOfAdd = dateOfAddStr ? new Date(dateOfAddStr) : new Date();

  if (isNaN(houseId) || !type || !amountStr || !title || !normalizedCategory) {
    return {
      error:
        "Please provide all required fields (House, Type, Amount, Title, Category).",
    };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  // Verify house & transaction existence concurrently
  const [house, existing] = await Promise.all([
    prisma.house.findFirst({
      where: { id: houseId, deletedAt: null },
    }),
    prisma.transaction.findFirst({
      where: { id },
    }),
  ]);

  if (!house) {
    return { error: "Selected house does not exist." };
  }

  if (!existing) {
    return { error: "Transaction not found." };
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      houseId,
      type,
      amount,
      title,
      desc,
      category: normalizedCategory,
      dateOfAdd,
    },
  });

  invalidateCashflowCaches();
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}

export async function getCashflowTrendData(
  timeframe: CashflowTimeframe = "1Y",
  houseId?: string | number
): Promise<CashflowChartDataPoint[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { targetIds, cacheKeySegment } = await resolveTargetHouseIds(houseId);
  const cacheKey = `cashflow_trend:${user.id}:${cacheKeySegment}:${timeframe}`;
  const cached = cacheGet<CashflowChartDataPoint[]>(cacheKey);
  if (cached) return cached;

  const txWhere: Prisma.TransactionWhereInput = {
    deletedAt: null,
    houseId: { in: targetIds },
  };

  const now = new Date();
  let endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  let startDate: Date = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  if (timeframe === "1Y") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  } else if (timeframe === "2Y") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 23, 1);
  } else if (timeframe === "3Y") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 35, 1);
  }

  // Fetch min/max dates in a single aggregate when ALL, otherwise only latestTx
  if (timeframe === "ALL") {
    const dateBounds = await prisma.transaction.aggregate({
      where: txWhere,
      _min: { dateOfAdd: true },
      _max: { dateOfAdd: true },
    });
    if (dateBounds._min.dateOfAdd) {
      startDate = new Date(
        dateBounds._min.dateOfAdd.getFullYear(),
        dateBounds._min.dateOfAdd.getMonth(),
        1
      );
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }
    if (dateBounds._max.dateOfAdd && dateBounds._max.dateOfAdd > endDate) {
      endDate = new Date(
        dateBounds._max.dateOfAdd.getFullYear(),
        dateBounds._max.dateOfAdd.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    }
  } else {
    // Extend end date if there are future-dated transactions
    const latestTx = await prisma.transaction.findFirst({
      where: txWhere,
      orderBy: { dateOfAdd: "desc" },
      select: { dateOfAdd: true },
    });
    if (latestTx?.dateOfAdd && latestTx.dateOfAdd > endDate) {
      endDate = new Date(
        latestTx.dateOfAdd.getFullYear(),
        latestTx.dateOfAdd.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    }
  }

  const totalMonths =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    1;

  const MONTH_SHORT = [
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

  const months: { key: string; label: string }[] = [];
  for (let i = 0; i < totalMonths; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const key = `${y}-${m}`;
    const label = `${MONTH_SHORT[d.getMonth()]} '${String(y).slice(-2)}`;
    months.push({ key, label });
  }

  const timelineMap: Record<
    string,
    { date: string; inflow: number; outflow: number; net: number }
  > = {};

  months.forEach(({ key, label }) => {
    timelineMap[key] = { date: label, inflow: 0, outflow: 0, net: 0 };
  });

  const transactions = await prisma.transaction.findMany({
    where: {
      ...txWhere,
      dateOfAdd: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      type: true,
      amount: true,
      dateOfAdd: true,
    },
    orderBy: { dateOfAdd: "asc" },
  });

  transactions.forEach((tx) => {
    const d = new Date(tx.dateOfAdd);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const key = `${y}-${m}`;
    if (timelineMap[key]) {
      const amt = Number(tx.amount);
      if (tx.type === "INFLOW") {
        timelineMap[key].inflow += amt;
        timelineMap[key].net += amt;
      } else {
        timelineMap[key].outflow += amt;
        timelineMap[key].net -= amt;
      }
    }
  });

  const result: CashflowChartDataPoint[] = months.map(
    ({ key }) => timelineMap[key]
  );
  cacheSet(cacheKey, result, 60000, ["dashboard", "transactions"]);
  return result;
}

export async function getDashboardSummary(
  selectedHouseId?: string | number,
  timeframe: CashflowTimeframe = "1Y"
): Promise<DashboardSummaryResult | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { targetIds, cacheKeySegment } =
    await resolveTargetHouseIds(selectedHouseId);
  const cacheKey = `dashboard:${user.id}:${cacheKeySegment}:${timeframe}`;
  const cached = cacheGet<DashboardSummaryResult>(cacheKey);
  if (cached) return cached;

  const houseWhere: Prisma.HouseWhereInput = {
    deletedAt: null,
    id: { in: targetIds },
  };
  const txWhere: Prisma.TransactionWhereInput = {
    deletedAt: null,
    houseId: { in: targetIds },
  };
  const loanWhere: Prisma.LoanWhereInput = {
    deletedAt: null,
    houseId: { in: targetIds },
  };

  // Run all independent queries concurrently in parallel with column-level select projection
  const [houses, transactions, loans, recentTransactions] = await Promise.all([
    prisma.house.findMany({
      where: houseWhere,
      select: { id: true, name: true, initialCash: true },
    }),
    prisma.transaction.findMany({
      where: txWhere,
      select: {
        type: true,
        amount: true,
        category: true,
        dateOfAdd: true,
      },
      orderBy: { dateOfAdd: "asc" },
    }),
    prisma.loan.findMany({
      where: loanWhere,
      select: {
        totalAmount: true,
        amountPaid: true,
      },
    }),
    prisma.transaction.findMany({
      where: txWhere,
      take: 6,
      orderBy: [{ dateOfAdd: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        amount: true,
        type: true,
        category: true,
        dateOfAdd: true,
        isFlagged: true,
        house: { select: { id: true, name: true } },
      },
    }),
  ]);

  // 1. Initial Cash across matching houses
  const totalInitialCash = houses.reduce(
    (acc, h) => acc + Number(h.initialCash),
    0
  );

  // 2. Inflow and Outflow sums
  let totalInflow = 0;
  let totalOutflow = 0;
  let inflowCount = 0;
  let outflowCount = 0;
  const categoryMap: Record<
    string,
    { count: number; total: number; type: TransactionType }
  > = {};

  transactions.forEach((tx) => {
    const amt = Number(tx.amount);
    if (tx.type === "INFLOW") {
      totalInflow += amt;
      inflowCount += 1;
    } else {
      totalOutflow += amt;
      outflowCount += 1;
    }

    const catKey = tx.category.toLowerCase();
    if (!categoryMap[catKey]) {
      categoryMap[catKey] = { count: 0, total: 0, type: tx.type };
    }
    categoryMap[catKey].count += 1;
    categoryMap[catKey].total += amt;
  });

  // 3. Loans given from this house / user
  const totalLoansDisbursed = loans.reduce(
    (acc, l) => acc + Number(l.totalAmount),
    0
  );
  const totalLoansPaidBack = loans.reduce(
    (acc, l) => acc + Number(l.amountPaid),
    0
  );
  const outstandingLoans = totalLoansDisbursed - totalLoansPaidBack;

  // 4. Exact current cash in hand calculation:
  // Current Cash = Initial Cash + Inflows - Outflows - Loans Disbursed + Repayments Received
  const currentCashInHand =
    totalInitialCash +
    totalInflow -
    totalOutflow -
    totalLoansDisbursed +
    totalLoansPaidBack;

  // 5. Timeline for Recharts: dynamically fetched per timeframe
  const timelineData = await getCashflowTrendData(timeframe, selectedHouseId);

  const result = {
    houses: houses.map((h) => ({
      ...h,
      initialCash: Number(h.initialCash),
    })),
    totalInitialCash,
    totalInflow,
    totalOutflow,
    inflowCount,
    outflowCount,
    netFlow: totalInflow - totalOutflow,
    totalLoansDisbursed,
    totalLoansPaidBack,
    outstandingLoans,
    currentCashInHand,
    categoryBreakdown: Object.entries(categoryMap)
      .map(([category, stats]) => ({
        category,
        ...stats,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    timelineData,
    recentTransactions: recentTransactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    })),
  };

  cacheSet(cacheKey, result, 60000, [
    "dashboard",
    "transactions",
    "houses",
    "loans",
  ]);
  return result;
}

export async function syncTransactionsFromExcelAction(
  formData: FormData
): Promise<ActionResponse<SyncStats>> {
  const user = await requireAuth();

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { error: "Please select a valid .xlsx file." };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
    );

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { error: "The uploaded Excel file has no worksheets." };
    }

    // 1. Locate Header Row
    let headerRowIdx = -1;
    const colMap: Record<string, number> = {};

    worksheet.eachRow((row, rowNumber) => {
      if (headerRowIdx !== -1) return;
      const values = (row.values as (string | undefined)[]) || [];
      const lowerValues = values.map((v) =>
        typeof v === "string" ? v.toLowerCase().trim() : ""
      );

      const hasDate = lowerValues.some((v) => v.includes("date"));
      const hasTitle = lowerValues.some((v) => v.includes("title"));
      const hasAmount = lowerValues.some((v) => v.includes("amount"));

      if (hasDate && (hasTitle || hasAmount)) {
        headerRowIdx = rowNumber;
        lowerValues.forEach((val, idx) => {
          if (!val) return;
          if (val.includes("date")) colMap["date"] = idx;
          else if (val.includes("title")) colMap["title"] = idx;
          else if (val.includes("desc")) colMap["desc"] = idx;
          else if (val.includes("house") || val.includes("property"))
            colMap["house"] = idx;
          else if (val.includes("category")) colMap["category"] = idx;
          else if (val.includes("type")) colMap["type"] = idx;
          else if (val.includes("amount")) colMap["amount"] = idx;
        });
      }
    });

    if (headerRowIdx === -1 || !colMap["date"] || !colMap["amount"]) {
      return {
        error:
          "Could not find standard headers in file. Required: Date, Title, House / Property, Category, Type, Amount (INR).",
      };
    }

    // 2. Fetch User's Houses & Existing Transactions concurrently for Deduplication
    const [userHouses, existingTxs] = await Promise.all([
      prisma.house.findMany({
        where: { userId: user.id, deletedAt: null },
        select: { id: true, name: true },
      }),
      prisma.transaction.findMany({
        where: { userId: user.id, deletedAt: null },
        select: {
          dateOfAdd: true,
          title: true,
          category: true,
          type: true,
          amount: true,
          houseId: true,
        },
      }),
    ]);

    const defaultHouseId = userHouses[0]?.id;
    if (!defaultHouseId) {
      return {
        error:
          "No active house found in your account. Please create a house first.",
      };
    }

    // 3. Build deduplication set: Date (YYYY-MM-DD) + Title + Category + Type + Amount + House / Property
    const seenSignatures = new Set<string>();
    for (const t of existingTxs) {
      const dStr = formatToDateStr(new Date(t.dateOfAdd));
      const nTitle = t.title.trim().toLowerCase();
      const nCat = t.category.trim().toLowerCase();
      const amt = Number(t.amount).toFixed(2);
      const sig = `${dStr}|${nTitle}|${nCat}|${t.type}|${amt}|${t.houseId}`;
      seenSignatures.add(sig);
    }

    // 4. Parse Rows
    const toInsert: {
      userId: number;
      houseId: number;
      type: TransactionType;
      amount: number;
      title: string;
      desc: string | null;
      category: string;
      dateOfAdd: Date;
    }[] = [];

    let skippedCount = 0;
    let totalParsedRows = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIdx) return;
      const rowValues = row.values as unknown[];
      if (!rowValues || rowValues.length === 0) return;

      const rawDate = colMap["date"] ? rowValues[colMap["date"]] : null;
      const rawTitle = colMap["title"] ? rowValues[colMap["title"]] : "";
      const rawDesc = colMap["desc"] ? rowValues[colMap["desc"]] : "";
      const rawHouse = colMap["house"] ? rowValues[colMap["house"]] : "";
      const rawCategory = colMap["category"]
        ? rowValues[colMap["category"]]
        : "";
      const rawType = colMap["type"] ? rowValues[colMap["type"]] : "";
      const rawAmount = colMap["amount"] ? rowValues[colMap["amount"]] : null;

      const extractText = (val: unknown): string => {
        if (val === null || val === undefined) return "";
        if (typeof val === "object") {
          const rec = val as Record<string, unknown>;
          if (rec.text) return String(rec.text).trim();
          if (rec.result) return String(rec.result).trim();
        }
        return String(val).trim();
      };

      const titleStr = extractText(rawTitle);
      const descStr = extractText(rawDesc);
      const houseStr = extractText(rawHouse);
      const catStr = extractText(rawCategory);
      const typeStr = extractText(rawType).toUpperCase();
      const amountVal =
        typeof rawAmount === "number"
          ? rawAmount
          : parseFloat(extractText(rawAmount).replace(/[^0-9.-]/g, ""));

      if (!titleStr && isNaN(amountVal)) {
        return;
      }

      totalParsedRows++;

      const dateObj = parseExcelDate(rawDate) || new Date();
      const dateStr = formatToDateStr(dateObj);
      const normTitle = (titleStr || "Transaction").toLowerCase();
      const normCategory = (catStr || "general").toLowerCase();
      const txType: TransactionType =
        typeStr === "INFLOW" ? "INFLOW" : "OUTFLOW";
      const cleanAmount = isNaN(amountVal) ? 0 : Math.abs(amountVal);
      const amtStr = cleanAmount.toFixed(2);

      let matchedHouseId = defaultHouseId;
      if (houseStr) {
        const found = userHouses.find(
          (h) => h.name.toLowerCase().trim() === houseStr.toLowerCase().trim()
        );
        if (found) {
          matchedHouseId = found.id;
        }
      }

      // Check deduplication signature: Date + Title + Category + Type + Amount + House / Property
      const signature = `${dateStr}|${normTitle}|${normCategory}|${txType}|${amtStr}|${matchedHouseId}`;

      if (seenSignatures.has(signature)) {
        skippedCount++;
        return;
      }

      seenSignatures.add(signature);

      toInsert.push({
        userId: user.id,
        houseId: matchedHouseId,
        type: txType,
        amount: cleanAmount,
        title: titleStr || "Transaction",
        desc: descStr && descStr !== "-" ? descStr : null,
        category: normCategory, // Stored directly as lowercase string
        dateOfAdd: dateObj,
      });
    });

    if (toInsert.length > 0) {
      await prisma.transaction.createMany({
        data: toInsert,
      });
    }

    invalidateCashflowCaches();
    revalidatePath("/");
    revalidatePath("/transactions");

    return {
      success: true,
      data: {
        added: toInsert.length,
        updated: 0,
        skipped: skippedCount,
        total: totalParsedRows,
      },
    };
  } catch (error: unknown) {
    console.error("Error syncing transactions from Excel:", error);
    const err = error as Error | undefined;
    return {
      error:
        err?.message ||
        "Failed to process Excel file. Please ensure it is a valid .xlsx file.",
    };
  }
}
