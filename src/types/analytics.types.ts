export type AnalyticsDatePreset =
  "3M" | "6M" | "1Y" | "2Y" | "3Y" | "ALL" | "CUSTOM";

export type AnalyticsViewMode = "cumulative" | "periodic";

export type CategoryAnalysisType = "OUTFLOW" | "INFLOW" | "COMBINED";

export type CategoryMetricDisplay = "amount" | "percentage";

export type HouseMetricView = "CASH_IN_HAND" | "CASHFLOW" | "NET";

export interface AnalyticsTransactionItem {
  id: number | string;
  type: "INFLOW" | "OUTFLOW";
  title: string;
  amount: number;
  category: string;
  houseName?: string;
}

export interface AnalyticsDataPoint {
  date: string; // YYYY-MM-DD
  label: string; // "20 Nov 26"
  inflow: number;
  outflow: number;
  cumulativeInflow: number;
  cumulativeOutflow: number;
  netFlow: number;
  hasInflow: boolean;
  hasOutflow: boolean;
  transactions: AnalyticsTransactionItem[];
}

export interface CategoryAnalyticsItem {
  category: string;
  type: "INFLOW" | "OUTFLOW" | "COMBINED";
  totalAmount: number;
  percentage: number;
  transactionCount: number;
  avgTransactionAmount: number;
  rank: number;
  isTop: boolean;
  isLowest: boolean;
  color: string;
}

export interface CategoryAnalyticsData {
  items: CategoryAnalyticsItem[];
  averageAmount: number;
  averagePercentage: number;
  totalCategoryAmount: number;
  categoryCount: number;
}

export interface CashflowAnalyticsResponse {
  points: AnalyticsDataPoint[];
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    inflowTransactionCount: number;
    outflowTransactionCount: number;
    dataPointCount: number;
    startDate: string;
    endDate: string;
    firstTransactionDate?: string;
  };
  categories: {
    inflow: CategoryAnalyticsData;
    outflow: CategoryAnalyticsData;
    combined: CategoryAnalyticsData;
  };
}

export interface AnalyticsFilterParams {
  houseId?: string | number;
  range?: AnalyticsDatePreset;
  startDate?: string;
  endDate?: string;
  mode?: AnalyticsViewMode;
}

export interface CashflowAnalyticsChartProps {
  initialData: CashflowAnalyticsResponse;
  houses: { id: number | string; name: string }[];
  currentHouseId?: string;
  currentRange?: AnalyticsDatePreset;
  currentStartDate?: string;
  currentEndDate?: string;
  currentMode?: AnalyticsViewMode;
}

export interface CategoryBarChartProps {
  inflowCategories: CategoryAnalyticsData;
  outflowCategories: CategoryAnalyticsData;
  combinedCategories: CategoryAnalyticsData;
  defaultType?: CategoryAnalysisType;
}

export interface HouseAnalyticsItem {
  id: number;
  name: string;
  initialCash: number;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  currentCashInHand: number;
  inflowCount: number;
  outflowCount: number;
  inflowShare: number;
  outflowShare: number;
  totalFlowShare: number;
  topInflowCategory?: { category: string; amount: number };
  topOutflowCategory?: { category: string; amount: number };
  outstandingLoans: number;
  color: string;
}

export interface HouseAnalyticsSummary {
  totalHouses: number;
  totalPortfolioCash: number;
  totalPortfolioInflow: number;
  totalPortfolioOutflow: number;
  netPortfolioFlow: number;
  totalPortfolioLoans: number;
  houses: HouseAnalyticsItem[];
}

export interface HouseAnalyticsSectionProps {
  data: HouseAnalyticsSummary;
}

export type RentalMonthStatus =
  | "PAID"
  | "COMBINED_PRIMARY"
  | "COMBINED_COVERED"
  | "MISSING"
  | "VACANT"
  | "UPCOMING";

export interface RentalMonthCell {
  month: number;
  monthName: string;
  status: RentalMonthStatus;
  amount: number;
  effectiveMonthlyAmount: number;
  transactionId?: number;
  transactionDate?: string;
  transactionTitle?: string;
  coveredMonths?: number[];
  coveredByMonth?: number;
  isVacant?: boolean;
  notes?: string;
}

export interface RentalUnitSummary {
  unitName: string;
  houseId?: number;
  houseName?: string;
  months: RentalMonthCell[];
  annualCollected: number;
  expectedMonthlyRent: number;
  expectedAnnualRent: number;
  paidMonthsCount: number;
  missingMonthsCount: number;
  vacantMonthsCount: number;
  combinedPaymentsCount: number;
  occupancyRate: number;
  collectionRate: number;
}

export interface RentalIncomeAnalyticsSummary {
  year: number;
  availableYears: number[];
  units: RentalUnitSummary[];
  totalAnnualCollected: number;
  totalExpectedAnnualRent: number;
  overallCollectionRate: number;
  totalMissingMonths: number;
  totalVacantMonths: number;
  totalMultiMonthPayments: number;
  overallOccupancyRate: number;
  monthlyTotals: { month: number; monthName: string; total: number }[];
}

export interface RentalIncomeSectionProps {
  data: RentalIncomeAnalyticsSummary;
  selectedYear: number;
  initialViewMode?: "TIMELINE" | "MATRIX" | "TABLE";
}

export interface AnalyticsPageProps {
  searchParams: Promise<{
    houseId?: string;
    range?: string;
    startDate?: string;
    endDate?: string;
    mode?: string;
    rentalYear?: string;
    rentalView?: string;
  }>;
}
