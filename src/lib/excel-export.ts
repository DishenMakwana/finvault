import ExcelJS from "exceljs";
import { ExportTransactionItem } from "@/types/transactions.types";

const EXCEL_INR_FORMAT =
  "[>=10000000][$₹-en-IN] ##,##,##,##0.00;[>=100000][$₹-en-IN] ##,##,##0.00;[$₹-en-IN] ##,##0.00";
const EXCEL_INR_NEGATIVE_FORMAT =
  "[<=-10000000]-[$₹-en-IN] ##,##,##,##0.00;[<=-100000]-[$₹-en-IN] ##,##,##0.00;-[$₹-en-IN] ##,##0.00";

export async function generateTransactionsExcel(
  transactions: ExportTransactionItem[],
  houseFilterName = "All Houses"
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FinVault";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Transactions Summary", {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  worksheet.mergeCells("A1:H1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `FINVAULT — CASH FLOW STATEMENT (${houseFilterName.toUpperCase()})`;
  titleCell.font = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0B0E14" },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 30;

  // Metadata row
  worksheet.mergeCells("A2:H2");
  const metaCell = worksheet.getCell("A2");
  metaCell.value = `Generated on: ${new Date().toLocaleString("en-IN")} | Total Records: ${transactions.length}`;
  metaCell.font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: "FF64748B" },
  };
  metaCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(2).height = 20;

  // Header row
  const headers = [
    { header: "Date", key: "date", width: 14 },
    { header: "Title", key: "title", width: 28 },
    { header: "Description", key: "desc", width: 32 },
    { header: "House / Property", key: "houseName", width: 22 },
    { header: "Category", key: "category", width: 18 },
    { header: "Type", key: "type", width: 14 },
    { header: "Amount (INR)", key: "amount", width: 20 },
    { header: "Logged At", key: "createdAt", width: 20 },
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.height = 26;

  headers.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = {
      name: "Calibri",
      size: 11,
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
      horizontal: index === 6 ? "right" : "left",
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF20293A" } },
      bottom: { style: "medium", color: { argb: "FF00D084" } },
      left: { style: "thin", color: { argb: "FF20293A" } },
      right: { style: "thin", color: { argb: "FF20293A" } },
    };
    worksheet.getColumn(index + 1).width = col.width;
  });

  // Populate data rows
  let rowIndex = 5;
  let totalInflow = 0;
  let totalOutflow = 0;

  transactions.forEach((item) => {
    const row = worksheet.getRow(rowIndex);
    row.height = 22;

    const d = new Date(item.date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const dateFormatted = isNaN(d.getTime()) ? "-" : `${day}/${month}/${year}`;

    const c = new Date(item.createdAt);
    const createdFormatted = isNaN(c.getTime())
      ? "-"
      : c.toLocaleString("en-IN");

    row.getCell(1).value = dateFormatted;
    row.getCell(2).value = item.title;
    row.getCell(3).value = item.desc || "-";
    row.getCell(4).value = item.houseName;
    row.getCell(5).value = item.category.toUpperCase();
    row.getCell(6).value = item.type;

    // Amount formatting
    const amountCell = row.getCell(7);
    amountCell.value = Number(item.amount);
    amountCell.numFmt = EXCEL_INR_FORMAT;
    amountCell.alignment = { horizontal: "right" };

    if (item.type === "INFLOW") {
      totalInflow += Number(item.amount);
      row.getCell(6).font = { color: { argb: "FF00D084" }, bold: true };
      amountCell.font = { color: { argb: "FF00D084" }, bold: true };
    } else {
      totalOutflow += Number(item.amount);
      row.getCell(6).font = { color: { argb: "FFF43F5E" }, bold: true };
      amountCell.font = { color: { argb: "FFF43F5E" }, bold: true };
    }

    row.getCell(8).value = createdFormatted;

    // Zebra striping
    const isEven = rowIndex % 2 === 0;
    const bgFill = isEven ? "FFF8FAFC" : "FFFFFFFF";
    for (let cIdx = 1; cIdx <= 8; cIdx++) {
      const cell = row.getCell(cIdx);
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (cell.fill === undefined || Object.keys(cell.fill).length === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgFill },
        };
      }
    }

    rowIndex++;
  });

  // Summary rows
  rowIndex++;
  const summaryStartRow = rowIndex;

  // Inflow Total
  const inflowRow = worksheet.getRow(summaryStartRow);
  inflowRow.getCell(6).value = "TOTAL INFLOW:";
  inflowRow.getCell(6).font = { bold: true, color: { argb: "FF00D084" } };
  inflowRow.getCell(6).alignment = { horizontal: "right" };
  const inflowCell = inflowRow.getCell(7);
  inflowCell.value = totalInflow;
  inflowCell.numFmt = EXCEL_INR_FORMAT;
  inflowCell.font = { bold: true, color: { argb: "FF00D084" }, size: 11 };

  // Outflow Total
  const outflowRow = worksheet.getRow(summaryStartRow + 1);
  outflowRow.getCell(6).value = "TOTAL OUTFLOW:";
  outflowRow.getCell(6).font = { bold: true, color: { argb: "FFF43F5E" } };
  outflowRow.getCell(6).alignment = { horizontal: "right" };
  const outflowCell = outflowRow.getCell(7);
  outflowCell.value = totalOutflow;
  outflowCell.numFmt = EXCEL_INR_FORMAT;
  outflowCell.font = { bold: true, color: { argb: "FFF43F5E" }, size: 11 };

  // Net Cash Flow Total
  const netRow = worksheet.getRow(summaryStartRow + 2);
  netRow.getCell(6).value = "NET CASH FLOW:";
  netRow.getCell(6).font = { bold: true, color: { argb: "FF0F172A" } };
  netRow.getCell(6).alignment = { horizontal: "right" };
  const netCell = netRow.getCell(7);
  const netAmount = totalInflow - totalOutflow;
  netCell.value = netAmount;
  netCell.numFmt =
    netAmount >= 0 ? EXCEL_INR_FORMAT : EXCEL_INR_NEGATIVE_FORMAT;
  netCell.font = {
    bold: true,
    color: { argb: netAmount >= 0 ? "FF00D084" : "FFF43F5E" },
    size: 12,
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
