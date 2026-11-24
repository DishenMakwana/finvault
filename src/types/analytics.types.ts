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

type RentalMonthStatus =
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
  currentHouseId?: string | number;
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
    cadenceItem?: string;
  }>;
}

export interface CadenceOccurrence {
  id: number;
  date: string;
  amount: number;
  title: string;
  category: string;
  houseId: number;
  houseName: string;
  daysSincePrevious: number | null;
  cumulativeTotal: number;
  isAnomaly: boolean;
  anomalyReason?: string;
  subType: "fuel" | "service" | "repair" | "care" | "insurance" | "general";
}

export interface CadenceIntervalBucket {
  label: string;
  count: number;
  percentage: number;
}

export interface DayOfMonthCluster {
  decade: "1st - 10th" | "11th - 20th" | "21st - 31st";
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface DayOfWeekDistribution {
  dayName: string;
  count: number;
  totalAmount: number;
}

export interface MonthlySpendRunRate {
  yearMonth: string;
  label: string;
  amount: number;
  count: number;
}

export interface SubTypeDecomposition {
  subType: string;
  label: string;
  count: number;
  totalAmount: number;
  percentage: number;
  color: string;
}

type CategoryPredictabilityClass = "FIXED" | "ELASTIC" | "WILDCARD";

interface OutflowVelocityMetrics {
  currentMonthTotal: number;
  daysElapsedInMonth: number;
  totalDaysInMonth: number;
  currentDailyBurnRate: number;
  projectedMonthEndSpend: number;
  baselineMonthlySpend: number;
  velocityPacingPercentage: number;
  status:
    "SLOW" | "NORMAL" | "ACCELERATED" | "OVERHEATING" | "CADENCE_ESTIMATED";
  mode: "LIVE_MTD" | "CADENCE_ESTIMATED";
  cadenceExpectedMonthly: number;
  cadenceIntervalDays: number;
}

interface OutflowVolatilityMetrics {
  standardDeviation: number;
  meanAmount: number;
  coefficientOfVariation: number;
  classification: CategoryPredictabilityClass;
  fixedBaselineAmount: number;
  volatilityScore: number;
}

interface OutflowAnomalyItem {
  id: number;
  title: string;
  amount: number;
  date: string;
  zScore: number;
  multiplierVsMedian: number;
  isFlagged: boolean;
}

interface ParetoConcentrationItem {
  name: string;
  amount: number;
  percentage: number;
  cumulativePercentage: number;
  transactionCount: number;
}

interface ParetoAnalysisResult {
  topDrivers: ParetoConcentrationItem[];
  tailSpendTotal: number;
  tailSpendPercentage: number;
  tailSpendCount: number;
  top20PercentSpendShare: number;
}

interface TemporalHeatmapCell {
  dayOfWeek: number;
  dayName: string;
  decade: "EARLY" | "MID" | "LATE";
  amount: number;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

interface MicroBleedMetrics {
  threshold: number;
  totalBleedAmount: number;
  totalBleedCount: number;
  percentageOfCategoryTotal: number;
  topMicroTitles: { title: string; count: number; total: number }[];
}

export interface ExtendedCategoryAnalytics {
  velocity: OutflowVelocityMetrics;
  volatility: OutflowVolatilityMetrics;
  anomalies: OutflowAnomalyItem[];
  pareto: ParetoAnalysisResult;
  temporalHeatmap: TemporalHeatmapCell[];
  microBleed: MicroBleedMetrics;
}

export interface SpendingCadenceAnalyticsResult {
  queryKey: string;
  queryLabel: string;
  totalSpent: number;
  totalOccurrences: number;
  averageAmount: number;
  medianAmount: number;
  minAmount: number;
  maxAmount: number;
  averageIntervalDays: number;
  medianIntervalDays: number;
  minIntervalDays: number;
  maxIntervalDays: number;
  regularityScore: number;
  predictedNextOccurrenceDate: string | null;
  predictedNextAmount: number;
  firstOccurrenceDate: string;
  lastOccurrenceDate: string;
  occurrences: CadenceOccurrence[];
  intervalBuckets: CadenceIntervalBucket[];
  dayOfMonthClusters: DayOfMonthCluster[];
  dayOfWeekDistribution: DayOfWeekDistribution[];
  monthlyRunRates: MonthlySpendRunRate[];
  subTypeBreakdown: SubTypeDecomposition[];
  anomaliesCount: number;
  extendedIntelligence?: ExtendedCategoryAnalytics;
}

export interface SpendingCadenceAvailableItem {
  id: string;
  label: string;
  count: number;
  totalSpent: number;
  category: string;
  isFeatured?: boolean;
}

export interface SpendingCadenceSectionProps {
  initialAnalytics: SpendingCadenceAnalyticsResult;
  availableItems: SpendingCadenceAvailableItem[];
  currentHouseId?: string;
  initialItemKey?: string;
}

export interface CategoryOutflowIntelligenceProps {
  data: ExtendedCategoryAnalytics;
  categoryLabel: string;
}

export interface ShubhDenominationItem {
  amount: number;
  label: string;
  count: number;
  total: number;
  percentage: number;
}

export interface MonthlyGivingTrajectory {
  yearMonth: string;
  label: string;
  bhogAmount: number;
  donationAmount: number;
  totalAmount: number;
  eventCount: number;
}

export interface SpiritualGivingPurpose {
  purpose:
    "ANNADANAM" | "TEMPLE_TRUST" | "JIVA_DAYA" | "SOCIAL_AID" | "GENERAL_DAAN";
  label: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface SpiritualGivingAnalyticsSummary {
  totalSpiritualOutflow: number;
  totalEventsCount: number;
  givingRatioOfOutflow: number;
  givingRatioOfInflow: number;
  bhogTotal: number;
  bhogCount: number;
  bhogPercentage: number;
  donationTotal: number;
  donationCount: number;
  donationPercentage: number;
  averageDonationTicket: number;
  medianTicketSize: number;
  activeGivingStreakMonths: number;
  festiveOutflowTotal: number;
  festiveOutflowPercentage: number;
  routineOutflowTotal: number;
  monthlyTrajectory: MonthlyGivingTrajectory[];
  shubhDenominations: ShubhDenominationItem[];
  purposeBreakdown: SpiritualGivingPurpose[];
  recentGivingEvents: {
    id: number;
    title: string;
    category: string;
    amount: number;
    date: string;
    isShubh: boolean;
  }[];
}

export interface SpiritualGivingSectionProps {
  data: SpiritualGivingAnalyticsSummary;
  currentHouseId?: string;
}

export interface RawRentalTx {
  id: number;
  title: string;
  amount: number;
  date: Date;
  houseId?: number;
  houseName?: string;
}

export interface ResolvedRentalPayment {
  amount: number;
  txId: number;
  txDate: string;
  txTitle: string;
  coveredMonths: number[];
}

export interface AnalyticsChartDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: AnalyticsDataPoint;
}

export interface AnalyticsTooltipProps {
  active?: boolean;
  payload?: { payload: AnalyticsDataPoint }[];
}

export interface CategoryBarCustomLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string;
  index?: number;
  payload?: CategoryAnalyticsItem;
}

export interface CategoryBarTooltipProps {
  active?: boolean;
  payload?: { payload: CategoryAnalyticsItem }[];
}
