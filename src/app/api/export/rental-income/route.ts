import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRentalIncomeAnalyticsData } from "@/lib/actions/analytics.actions";
import { generateRentalIncomeExcel } from "@/lib/rental-excel-export";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const houseIdParam = searchParams.get("houseId");

    const currentYear = new Date().getFullYear();
    const year = yearParam ? parseInt(yearParam, 10) : currentYear;
    const houseId =
      houseIdParam && houseIdParam !== "ALL"
        ? parseInt(houseIdParam, 10)
        : undefined;

    const data = await getRentalIncomeAnalyticsData(
      year,
      isNaN(houseId as number) ? undefined : houseId
    );

    const excelBuffer = await generateRentalIncomeExcel(data, year);

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="FinVault_Rental_Income_${year}.xlsx"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to export rental income excel:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel report" },
      { status: 500 }
    );
  }
}
