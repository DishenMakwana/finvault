export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "₹ 0.00";
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const parts = absNum.toFixed(2).split(".");
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian Numbering System: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formattedInteger =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

  const result = `₹ ${formattedInteger}.${decimalPart}`;
  return isNegative ? `-${result}` : result;
}

export function formatCompactINR(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "₹ 0";
  }

  const num = Number(amount);
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 10000000) {
    return `${sign}₹ ${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹ ${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹ ${(abs / 1000).toFixed(1)} K`;
  }

  return `${sign}₹ ${abs.toFixed(0)}`;
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

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  if (typeof date === "string") {
    const dmyMatch = date.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, "0");
      const monthIdx = parseInt(dmyMatch[2], 10) - 1;
      let year = dmyMatch[3];
      if (year.length === 2) {
        year = String(
          parseInt(year, 10) < 70
            ? 2000 + parseInt(year, 10)
            : 1900 + parseInt(year, 10)
        );
      }
      return `${day} ${MONTH_NAMES[monthIdx] || ""} ${year}`;
    }
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const monthIdx = parseInt(match[2], 10) - 1;
      return `${match[3]} ${MONTH_NAMES[monthIdx]} ${match[1]}`;
    }
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateDMY(date: Date | string | null | undefined): string {
  if (!date) return "-";
  if (typeof date === "string") {
    const dmyMatch = date.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, "0");
      const month = dmyMatch[2].padStart(2, "0");
      let year = dmyMatch[3];
      if (year.length === 2) {
        year = String(
          parseInt(year, 10) < 70
            ? 2000 + parseInt(year, 10)
            : 1900 + parseInt(year, 10)
        );
      }
      return `${day}/${month}/${year}`;
    }
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");
  const strMinutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} at ${strHours}:${strMinutes} ${ampm}`;
}

export function parseExcelDate(val: any): Date | null {
  if (!val) return null;

  // 1. Unwrap ExcelJS cell objects (formula result, rich text, cell date)
  if (typeof val === "object" && !(val instanceof Date)) {
    if (val.result !== undefined && val.result !== null) {
      val = val.result;
    } else if (val.text !== undefined && val.text !== null) {
      val = val.text;
    } else if (val.date instanceof Date) {
      val = val.date;
    }
  }

  // 2. Direct Date object
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  // 3. Excel serial date (days since 1899-12-30)
  if (typeof val === "number") {
    const ms = (val - 25569) * 86400 * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // 4. String format parsing
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Prioritize DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10);
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) {
        year += year < 70 ? 2000 : 1900;
      }
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? null : d;
      }
    }

    // Secondary: ISO format YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? null : d;
      }
    }

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function formatToDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
