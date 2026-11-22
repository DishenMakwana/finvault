import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "FinVault";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Sample Statement", {
      views: [{ showGridLines: true }],
    });

    // Header styling
    const headers = [
      { header: "Date", key: "date", width: 14 },
      { header: "Title", key: "title", width: 34 },
      { header: "Description", key: "desc", width: 24 },
      { header: "House / Property", key: "house", width: 22 },
      { header: "Category", key: "category", width: 20 },
      { header: "Type", key: "type", width: 14 },
      { header: "Amount (INR)", key: "amount", width: 16 },
    ];

    worksheet.columns = headers;

    const headerRow = worksheet.getRow(1);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF004D25" }, // FinVault Dark Green Brand accent
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF007A3D" } },
        bottom: { style: "medium", color: { argb: "FF007A3D" } },
      };
    });

    // Realistic generic sample rows
    const sampleRows = [
      [
        "2026-01-05",
        "Monthly Rental Income",
        "Ground floor unit",
        "Main House",
        "RENT",
        "INFLOW",
        45000,
      ],
      [
        "2026-01-10",
        "Vehicle Fuel & Maintenance",
        "Service & petrol",
        "Main House",
        "VEHICLE",
        "OUTFLOW",
        4500,
      ],
      [
        "2026-01-15",
        "Groceries & Supermarket Supplies",
        "Monthly pantry supplies",
        "Main House",
        "GROCERIES",
        "OUTFLOW",
        12500,
      ],
      [
        "2026-01-20",
        "Electricity & Water Utility Bill",
        "January utility payment",
        "Main House",
        "UTILITIES",
        "OUTFLOW",
        3800,
      ],
      [
        "2026-01-25",
        "Consulting Services Income",
        "Q1 invoice payment",
        "Downtown Office",
        "BUSINESS",
        "INFLOW",
        75000,
      ],
      [
        "2026-02-01",
        "Staff Monthly Salary",
        "Assistant & maintenance staff",
        "Downtown Office",
        "SALARY",
        "OUTFLOW",
        30000,
      ],
      [
        "2026-02-05",
        "Monthly Rental Income",
        "Ground floor unit",
        "Main House",
        "RENT",
        "INFLOW",
        45000,
      ],
      [
        "2026-02-10",
        "Annual Health & Life Insurance",
        "Policy renewal",
        "Main House",
        "INSURANCE",
        "OUTFLOW",
        18500,
      ],
      [
        "2026-02-14",
        "Team Lunch & Networking Dining",
        "Business dining expense",
        "Main House",
        "LIFESTYLE",
        "OUTFLOW",
        4200,
      ],
      [
        "2026-02-20",
        "Commercial Plot Legal & Stamp Duty",
        "Legal advisory fees",
        "Downtown Office",
        "ADVOCATE",
        "OUTFLOW",
        25000,
      ],
      [
        "2026-02-25",
        "Community Welfare Donation",
        "Charitable contribution",
        "Main House",
        "DONATION",
        "OUTFLOW",
        5000,
      ],
      [
        "2026-03-01",
        "Bank Cash Deposit",
        "Savings account transfer",
        "Main House",
        "CASH DEPOSIT",
        "OUTFLOW",
        20000,
      ],
      [
        "2026-03-05",
        "Monthly Rental Income",
        "Ground floor unit",
        "Main House",
        "RENT",
        "INFLOW",
        45000,
      ],
      [
        "2026-03-12",
        "Property Plumbing & Maintenance",
        "Facility repairs",
        "Main House",
        "MAINTENANCE",
        "OUTFLOW",
        3500,
      ],
      [
        "2026-03-18",
        "Quarterly Property Tax",
        "Municipal tax assessment",
        "Downtown Office",
        "TAXES",
        "OUTFLOW",
        14000,
      ],
      [
        "2026-03-25",
        "High-Speed Internet & Telecom",
        "Broadband bills",
        "Downtown Office",
        "UTILITIES",
        "OUTFLOW",
        2200,
      ],
    ];

    sampleRows.forEach((rowValues) => {
      const rawDate = String(rowValues[0]);
      const dmyDate = rawDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2/$1");
      const formattedRow = [dmyDate, ...rowValues.slice(1)];
      const addedRow = worksheet.addRow(formattedRow);
      addedRow.height = 20;

      // Align date, house, category, type
      addedRow.getCell(1).alignment = { horizontal: "center" };
      addedRow.getCell(1).numFmt = "@";
      addedRow.getCell(4).alignment = { horizontal: "left" };
      addedRow.getCell(5).alignment = { horizontal: "left" };
      addedRow.getCell(6).alignment = { horizontal: "center" };
      const amtCell = addedRow.getCell(7);
      amtCell.numFmt =
        "[>=10000000][$₹-en-IN] ##,##,##,##0.00;[>=100000][$₹-en-IN] ##,##,##0.00;[$₹-en-IN] ##,##0.00";
      amtCell.alignment = { horizontal: "right" };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="FinVault_Sample_Transaction_Statement.xlsx"',
      },
    });
  } catch (error) {
    console.error("Error generating sample Excel:", error);
    return NextResponse.json(
      { error: "Failed to generate sample statement" },
      { status: 500 }
    );
  }
}
