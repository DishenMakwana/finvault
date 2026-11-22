import ExcelJS from "exceljs";
import { RentalIncomeAnalyticsSummary } from "@/types/analytics.types";

const EXCEL_INR_FORMAT =
  "[>=10000000][$₹-en-IN] ##,##,##,##0.00;[>=100000][$₹-en-IN] ##,##,##0.00;[$₹-en-IN] ##,##0.00";
const EXCEL_INR_NEGATIVE_FORMAT =
  "[<=-10000000]-[$₹-en-IN] ##,##,##,##0.00;[<=-100000]-[$₹-en-IN] ##,##,##0.00;-[$₹-en-IN] ##,##0.00";

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

export async function generateRentalIncomeExcel(
  data: RentalIncomeAnalyticsSummary,
  year: number
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FinVault";
  workbook.created = new Date();

  // ==========================================
  // SHEET 1: Unit Summary & Annual Performance
  // ==========================================
  const summarySheet = workbook.addWorksheet(`Rental Summary ${year}`, {
    views: [{ showGridLines: true }],
  });

  // 1. Title Banner
  summarySheet.mergeCells("A1:L1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = `FINVAULT — RENTAL INCOME & OCCUPANCY AUDIT (FY ${year})`;
  titleCell.font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  summarySheet.getRow(1).height = 32;

  for (let c = 1; c <= 12; c++) {
    const cell = summarySheet.getRow(1).getCell(c);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B0E14" },
    };
  }

  // 2. Metadata Subtitle
  summarySheet.mergeCells("A2:L2");
  const metaCell = summarySheet.getCell("A2");
  metaCell.value = `Generated on: ${new Date().toLocaleString("en-IN")} | Units Tracked: ${data.units.length} | Annual Collection Rate: ${data.overallCollectionRate}% | Occupancy Rate: ${data.overallOccupancyRate}%`;
  metaCell.font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: "FF64748B" },
  };
  metaCell.alignment = { vertical: "middle", horizontal: "center" };
  summarySheet.getRow(2).height = 20;

  for (let c = 1; c <= 12; c++) {
    const cell = summarySheet.getRow(2).getCell(c);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF131823" },
    };
  }

  // 3. Table Headers
  const summaryHeaders = [
    { header: "Rental Unit", key: "unitName", width: 26 },
    { header: "House / Property", key: "houseName", width: 22 },
    { header: "Monthly Rate (INR)", key: "monthlyRate", width: 20 },
    { header: "Annual Target (INR)", key: "target", width: 22 },
    { header: "Total Received (INR)", key: "collected", width: 22 },
    { header: "Balance Due (INR)", key: "balance", width: 20 },
    { header: "Paid Months", key: "paidMonths", width: 14 },
    { header: "Missing Months", key: "missingMonths", width: 24 },
    { header: "Vacant Months", key: "vacantMonths", width: 20 },
    { header: "Collection %", key: "collectionRate", width: 15 },
    { header: "Occupancy %", key: "occupancyRate", width: 15 },
    { header: "Audit Status", key: "status", width: 16 },
  ];

  const headerRow1 = summarySheet.getRow(4);
  headerRow1.height = 26;

  summaryHeaders.forEach((col, idx) => {
    const cell = headerRow1.getCell(idx + 1);
    cell.value = col.header;
    cell.font = {
      name: "Calibri",
      size: 10.5,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF131823" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: idx >= 2 && idx <= 5 ? "right" : idx >= 6 ? "center" : "left",
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF20293A" } },
      bottom: { style: "medium", color: { argb: "FF6366F1" } },
      left: { style: "thin", color: { argb: "FF20293A" } },
      right: { style: "thin", color: { argb: "FF20293A" } },
    };
    summarySheet.getColumn(idx + 1).width = col.width;
  });

  // 4. Data Rows
  let curRow = 5;
  data.units.forEach((u) => {
    const row = summarySheet.getRow(curRow);
    row.height = 22;

    const balanceDue = Math.max(0, u.expectedAnnualRent - u.annualCollected);
    const missingNames = u.months
      .filter((m) => m.status === "MISSING")
      .map((m) => m.monthName)
      .join(", ");
    const vacantNames = u.months
      .filter((m) => m.status === "VACANT")
      .map((m) => m.monthName)
      .join(", ");

    row.getCell(1).value = u.unitName;
    row.getCell(2).value = u.houseName || "—";

    const monthlyCell = row.getCell(3);
    monthlyCell.value = u.expectedMonthlyRent;
    monthlyCell.numFmt = EXCEL_INR_FORMAT;
    monthlyCell.alignment = { horizontal: "right" };

    const targetCell = row.getCell(4);
    targetCell.value = u.expectedAnnualRent;
    targetCell.numFmt = EXCEL_INR_FORMAT;
    targetCell.alignment = { horizontal: "right" };

    const collectedCell = row.getCell(5);
    collectedCell.value = u.annualCollected;
    collectedCell.numFmt = EXCEL_INR_FORMAT;
    collectedCell.font = { color: { argb: "FF00D084" }, bold: true };
    collectedCell.alignment = { horizontal: "right" };

    const balanceCell = row.getCell(6);
    balanceCell.value = balanceDue;
    balanceCell.numFmt =
      balanceDue > 0 ? EXCEL_INR_NEGATIVE_FORMAT : EXCEL_INR_FORMAT;
    balanceCell.font = {
      color: { argb: balanceDue > 0 ? "FFF43F5E" : "FF00D084" },
      bold: true,
    };
    balanceCell.alignment = { horizontal: "right" };

    const paidCell = row.getCell(7);
    paidCell.value = `${u.paidMonthsCount} / 12`;
    paidCell.alignment = { horizontal: "center" };

    const missingCell = row.getCell(8);
    missingCell.value =
      u.missingMonthsCount > 0
        ? `${u.missingMonthsCount} (${missingNames})`
        : "None (Paid)";
    missingCell.font = {
      color: { argb: u.missingMonthsCount > 0 ? "FFF43F5E" : "FF64748B" },
    };
    missingCell.alignment = { horizontal: "center" };

    const vacantCell = row.getCell(9);
    vacantCell.value =
      u.vacantMonthsCount > 0
        ? `${u.vacantMonthsCount} (${vacantNames})`
        : "None";
    vacantCell.alignment = { horizontal: "center" };

    const collRateCell = row.getCell(10);
    collRateCell.value = `${u.collectionRate}%`;
    collRateCell.alignment = { horizontal: "center" };
    collRateCell.font = {
      bold: true,
      color: {
        argb:
          u.collectionRate >= 95
            ? "FF00D084"
            : u.collectionRate >= 80
              ? "FF6366F1"
              : "FFF43F5E",
      },
    };

    const occRateCell = row.getCell(11);
    occRateCell.value = `${u.occupancyRate}%`;
    occRateCell.alignment = { horizontal: "center" };
    occRateCell.font = {
      bold: true,
      color: {
        argb:
          u.occupancyRate >= 90
            ? "FF00D084"
            : u.occupancyRate >= 70
              ? "FFF59E0B"
              : "FFF43F5E",
      },
    };

    const statusCell = row.getCell(12);
    statusCell.value =
      u.missingMonthsCount === 0 ? "✓ Up to Date" : "⚠️ Rent Overdue";
    statusCell.font = {
      bold: true,
      color: { argb: u.missingMonthsCount === 0 ? "FF00D084" : "FFF43F5E" },
    };
    statusCell.alignment = { horizontal: "center" };

    // Zebra striping
    const isEven = curRow % 2 === 0;
    const bgFill = isEven ? "FFF8FAFC" : "FFFFFFFF";
    for (let c = 1; c <= 12; c++) {
      const cell = row.getCell(c);
      cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
      if (!cell.fill || Object.keys(cell.fill).length === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgFill },
        };
      }
    }

    curRow++;
  });

  // 5. Total Row
  const totalRow = summarySheet.getRow(curRow);
  totalRow.height = 24;
  totalRow.getCell(1).value = "TOTAL PORTFOLIO";
  totalRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  totalRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };

  for (let c = 2; c <= 12; c++) {
    totalRow.getCell(c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };
  }

  const totTargetCell = totalRow.getCell(4);
  totTargetCell.value = data.totalExpectedAnnualRent;
  totTargetCell.numFmt = EXCEL_INR_FORMAT;
  totTargetCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  totTargetCell.alignment = { horizontal: "right" };

  const totCollCell = totalRow.getCell(5);
  totCollCell.value = data.totalAnnualCollected;
  totCollCell.numFmt = EXCEL_INR_FORMAT;
  totCollCell.font = { bold: true, color: { argb: "FF00D084" } };
  totCollCell.alignment = { horizontal: "right" };

  const totBalance = Math.max(
    0,
    data.totalExpectedAnnualRent - data.totalAnnualCollected
  );
  const totBalCell = totalRow.getCell(6);
  totBalCell.value = totBalance;
  totBalCell.numFmt =
    totBalance > 0 ? EXCEL_INR_NEGATIVE_FORMAT : EXCEL_INR_FORMAT;
  totBalCell.font = {
    bold: true,
    color: { argb: totBalance > 0 ? "FFF43F5E" : "FF00D084" },
  };
  totBalCell.alignment = { horizontal: "right" };

  const totPaidCell = totalRow.getCell(7);
  const totalPaidMonths = data.units.reduce(
    (acc, u) => acc + u.paidMonthsCount,
    0
  );
  totPaidCell.value = `${totalPaidMonths} / ${data.units.length * 12}`;
  totPaidCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  totPaidCell.alignment = { horizontal: "center" };

  const totMissingCell = totalRow.getCell(8);
  totMissingCell.value = `${data.totalMissingMonths} Months`;
  totMissingCell.font = {
    bold: true,
    color: { argb: data.totalMissingMonths > 0 ? "FFF43F5E" : "FF00D084" },
  };
  totMissingCell.alignment = { horizontal: "center" };

  const totVacCell = totalRow.getCell(9);
  totVacCell.value = `${data.totalVacantMonths} Months`;
  totVacCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  totVacCell.alignment = { horizontal: "center" };

  const totCollRateCell = totalRow.getCell(10);
  totCollRateCell.value = `${data.overallCollectionRate}%`;
  totCollRateCell.font = { bold: true, color: { argb: "FF6366F1" } };
  totCollRateCell.alignment = { horizontal: "center" };

  const totOccRateCell = totalRow.getCell(11);
  totOccRateCell.value = `${data.overallOccupancyRate}%`;
  totOccRateCell.font = { bold: true, color: { argb: "FF00D084" } };
  totOccRateCell.alignment = { horizontal: "center" };

  // ==========================================
  // SHEET 2: 12-Month Matrix (Horizontal Breakdown View)
  // ==========================================
  const matrixSheet = workbook.addWorksheet(`12-Month Matrix ${year}`, {
    views: [{ showGridLines: true }],
  });

  const numUnits = data.units.length;
  const totalCols = 1 + numUnits + 2; // Month + Units + Monthly Total + Month Status
  const lastColLetter = String.fromCharCode(64 + Math.min(totalCols, 26));

  matrixSheet.mergeCells(`A1:${lastColLetter}1`);
  const mTitleCell = matrixSheet.getCell("A1");
  mTitleCell.value = `FINVAULT — 12-MONTH RENTAL BREAKDOWN (FY ${year})`;
  mTitleCell.font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  mTitleCell.alignment = { vertical: "middle", horizontal: "center" };
  matrixSheet.getRow(1).height = 30;

  for (let c = 1; c <= totalCols; c++) {
    matrixSheet.getRow(1).getCell(c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B0E14" },
    };
  }

  matrixSheet.mergeCells(`A2:${lastColLetter}2`);
  const mMetaCell = matrixSheet.getCell("A2");
  mMetaCell.value = `Generated on: ${new Date().toLocaleString("en-IN")} | Total Collected: ${data.totalAnnualCollected.toLocaleString("en-IN")} | Collection Rate: ${data.overallCollectionRate}% | Occupancy Rate: ${data.overallOccupancyRate}%`;
  mMetaCell.font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: "FF64748B" },
  };
  mMetaCell.alignment = { vertical: "middle", horizontal: "center" };
  matrixSheet.getRow(2).height = 20;

  for (let c = 1; c <= totalCols; c++) {
    matrixSheet.getRow(2).getCell(c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF131823" },
    };
  }

  // Column Headers: Month | Unit 1 | Unit 2 | ... | Monthly Flow | Month Status
  const hHeaders = [
    { header: "Month", width: 16 },
    ...data.units.map((u) => ({
      header: `${u.unitName}${u.expectedMonthlyRent > 0 ? ` (~₹${Math.round(u.expectedMonthlyRent / 1000)}k/mo)` : ""}`,
      width: 24,
    })),
    { header: "Monthly Flow (INR)", width: 22 },
    { header: "Month Status", width: 20 },
  ];

  const hHeaderRow = matrixSheet.getRow(3);
  hHeaderRow.height = 26;
  hHeaders.forEach((col, idx) => {
    const cell = hHeaderRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = {
      name: "Calibri",
      size: 10.5,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF131823" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: idx === 0 ? "left" : "center",
    };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF6366F1" } },
      left: { style: "thin", color: { argb: "FF20293A" } },
      right: { style: "thin", color: { argb: "FF20293A" } },
    };
    matrixSheet.getColumn(idx + 1).width = col.width;
  });

  // Rows 4 to 15: Jan to Dec
  for (let m = 1; m <= 12; m++) {
    const rIdx = m + 3;
    const row = matrixSheet.getRow(rIdx);
    row.height = 22;

    const monthName = MONTH_NAMES[m - 1];
    row.getCell(1).value = `${monthName} ${year}`;
    row.getCell(1).font = { bold: true };

    let paidCount = 0;
    let missingCount = 0;
    let upcomingCount = 0;

    data.units.forEach((u, uIdx) => {
      const cell = row.getCell(uIdx + 2);
      const mCell = u.months.find((c) => c.month === m);

      if (!mCell || mCell.status === "UPCOMING") {
        cell.value = "— (Upcoming)";
        cell.font = { color: { argb: "FF94A3B8" } };
        upcomingCount++;
      } else if (mCell.status === "PAID") {
        cell.value = mCell.amount;
        cell.numFmt = EXCEL_INR_FORMAT;
        cell.font = { color: { argb: "FF00D084" }, bold: true };
        paidCount++;
      } else if (mCell.status === "COMBINED_PRIMARY") {
        cell.value = `${mCell.amount.toLocaleString("en-IN")} (2M Rent)`;
        cell.font = { color: { argb: "FF6366F1" }, bold: true };
        paidCount++;
      } else if (mCell.status === "COMBINED_COVERED") {
        cell.value = `~${mCell.effectiveMonthlyAmount.toLocaleString("en-IN")} (Covered)`;
        cell.font = { color: { argb: "FF38BDF8" } };
        paidCount++;
      } else if (mCell.status === "MISSING") {
        cell.value = "₹ 0 (Missing)";
        cell.font = { color: { argb: "FFF43F5E" }, bold: true };
        missingCount++;
      } else if (mCell.status === "VACANT") {
        cell.value = "— (Vacant)";
        cell.font = { color: { argb: "FF94A3B8" } };
      }
      cell.alignment = { horizontal: "center" };
    });

    const totColIdx = numUnits + 2;
    const mTotal = data.monthlyTotals[m - 1]?.total || 0;
    const totCell = row.getCell(totColIdx);
    totCell.value = mTotal > 0 ? mTotal : 0;
    totCell.numFmt = EXCEL_INR_FORMAT;
    totCell.font = {
      bold: true,
      color: { argb: mTotal > 0 ? "FF00D084" : "FF94A3B8" },
    };
    totCell.alignment = { horizontal: "right" };

    const statusColIdx = numUnits + 3;
    const statusCell = row.getCell(statusColIdx);
    if (upcomingCount === data.units.length) {
      statusCell.value = "Upcoming";
      statusCell.font = { color: { argb: "FF94A3B8" } };
    } else if (missingCount === 0) {
      statusCell.value = `✓ All Paid (${paidCount}/${data.units.length})`;
      statusCell.font = { color: { argb: "FF00D084" }, bold: true };
    } else {
      statusCell.value = `⚠️ ${missingCount} Overdue`;
      statusCell.font = { color: { argb: "FFF43F5E" }, bold: true };
    }
    statusCell.alignment = { horizontal: "center" };

    const isEven = m % 2 === 0;
    const bgFill = isEven ? "FFF8FAFC" : "FFFFFFFF";
    for (let c = 1; c <= totalCols; c++) {
      const cell = row.getCell(c);
      cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
      if (!cell.fill || Object.keys(cell.fill).length === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgFill },
        };
      }
    }
  }

  // Footer Summary Rows for Sheet 2
  // 1. Annual Collected
  const footRow1 = matrixSheet.getRow(16);
  footRow1.height = 24;
  footRow1.getCell(1).value = "ANNUAL TOTAL";
  footRow1.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  for (let c = 1; c <= totalCols; c++) {
    footRow1.getCell(c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };
  }
  data.units.forEach((u, uIdx) => {
    const cell = footRow1.getCell(uIdx + 2);
    cell.value = u.annualCollected;
    cell.numFmt = EXCEL_INR_FORMAT;
    cell.font = { bold: true, color: { argb: "FF00D084" } };
    cell.alignment = { horizontal: "right" };
  });
  const fTotCell = footRow1.getCell(numUnits + 2);
  fTotCell.value = data.totalAnnualCollected;
  fTotCell.numFmt = EXCEL_INR_FORMAT;
  fTotCell.font = { bold: true, color: { argb: "FF00D084" } };
  fTotCell.alignment = { horizontal: "right" };

  const fStatCell = footRow1.getCell(numUnits + 3);
  fStatCell.value = `${data.overallCollectionRate}% Realized`;
  fStatCell.font = { bold: true, color: { argb: "FF6366F1" } };
  fStatCell.alignment = { horizontal: "center" };

  // 2. Annual Target
  const footRow2 = matrixSheet.getRow(17);
  footRow2.height = 22;
  footRow2.getCell(1).value = "ANNUAL TARGET";
  footRow2.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  for (let c = 1; c <= totalCols; c++) {
    footRow2.getCell(c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };
  }
  data.units.forEach((u, uIdx) => {
    const cell = footRow2.getCell(uIdx + 2);
    cell.value = u.expectedAnnualRent;
    cell.numFmt = EXCEL_INR_FORMAT;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "right" };
  });
  const fTargCell = footRow2.getCell(numUnits + 2);
  fTargCell.value = data.totalExpectedAnnualRent;
  fTargCell.numFmt = EXCEL_INR_FORMAT;
  fTargCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  fTargCell.alignment = { horizontal: "right" };

  const fTargStat = footRow2.getCell(numUnits + 3);
  fTargStat.value = "Target Expected";
  fTargStat.font = { color: { argb: "FF94A3B8" } };
  fTargStat.alignment = { horizontal: "center" };

  // 3. Occupancy %
  const footRow3 = matrixSheet.getRow(18);
  footRow3.height = 22;
  footRow3.getCell(1).value = "OCCUPANCY RATE";
  footRow3.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  for (let c = 1; c <= totalCols; c++) {
    footRow3.getCell(c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };
  }
  data.units.forEach((u, uIdx) => {
    const cell = footRow3.getCell(uIdx + 2);
    cell.value = `${u.occupancyRate}%`;
    cell.font = { bold: true, color: { argb: "FF38BDF8" } };
    cell.alignment = { horizontal: "center" };
  });
  const fOccTot = footRow3.getCell(numUnits + 2);
  fOccTot.value = `${data.overallOccupancyRate}%`;
  fOccTot.font = { bold: true, color: { argb: "FF38BDF8" } };
  fOccTot.alignment = { horizontal: "center" };

  const fOccStat = footRow3.getCell(numUnits + 3);
  fOccStat.value = "Physical Occupancy";
  fOccStat.font = { color: { argb: "FF94A3B8" } };
  fOccStat.alignment = { horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
