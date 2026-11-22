import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTransactionsExcel } from "@/lib/excel-export";
import { ExportTransactionItem } from "@/types/transactions.types";
import { TransactionType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const { searchParams } = new URL(req.url);
    const houseIdStr = searchParams.get("houseId");
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const flagged = searchParams.get("flagged");

    const whereClause: any = {
      deletedAt: null,
    };

    if (flagged === "true" || flagged === "1") {
      whereClause.isFlagged = true;
    }

    if (houseIdStr && houseIdStr !== "ALL") {
      const parsedHId = parseInt(houseIdStr, 10);
      if (!isNaN(parsedHId)) {
        whereClause.houseId = parsedHId;
      }
    }

    if (type && type !== "ALL") {
      whereClause.type = type as TransactionType;
    }

    if (category && category !== "ALL") {
      const cats = category
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);
      if (cats.length === 1) {
        whereClause.category = cats[0];
      } else if (cats.length > 1) {
        whereClause.category = { in: cats };
      }
    }

    if (startDate || endDate) {
      whereClause.dateOfAdd = {};
      if (startDate) whereClause.dateOfAdd.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.dateOfAdd.lte = end;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        id: true,
        dateOfAdd: true,
        title: true,
        desc: true,
        category: true,
        type: true,
        amount: true,
        createdAt: true,
        isFlagged: true,
        house: { select: { name: true } },
      },
      orderBy: { dateOfAdd: "desc" },
    });

    const exportItems: ExportTransactionItem[] = transactions.map((t) => ({
      id: t.id,
      date: t.dateOfAdd,
      title: t.title,
      desc: t.desc,
      category: t.category,
      houseName: t.house?.name || "General",
      type: t.type,
      amount: Number(t.amount),
      isFlagged: t.isFlagged,
      createdAt: t.createdAt,
    }));

    let houseName = "All Houses";
    if (houseIdStr && houseIdStr !== "ALL") {
      const parsedHId = parseInt(houseIdStr, 10);
      if (!isNaN(parsedHId)) {
        const house = await prisma.house.findUnique({
          where: { id: parsedHId },
          select: { name: true },
        });
        if (house) houseName = house.name;
      }
    }

    const excelBuffer = await generateTransactionsExcel(exportItems, houseName);

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="FinVault_Transactions_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
