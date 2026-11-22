import { LucideIcon } from "lucide-react";

type KpiIconName =
  | "cash"
  | "rupee"
  | "inflow"
  | "trending-up"
  | "outflow"
  | "trending-down"
  | "loans"
  | "hand-coins"
  | "sessions"
  | "shield-check"
  | "check"
  | "check-circle"
  | "alert"
  | "warning"
  | "clock";

export interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  iconName?: KpiIconName;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
  deltaText?: string;
  deltaType?: "positive" | "negative" | "neutral";
  subtext?: string;
  index?: number;
}

export interface QuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  houses: { id: number | string; name: string }[];
  defaultHouseId?: number | string;
  categories?: string[];
}

export type CashflowTimeframe = "1Y" | "2Y" | "3Y" | "ALL";

export interface CashflowChartDataPoint {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface CashflowChartProps {
  data?: CashflowChartDataPoint[];
  initialData?: CashflowChartDataPoint[];
  currentHouseId?: string | number;
  initialTimeframe?: CashflowTimeframe;
}

export interface DashboardPageProps {
  searchParams: Promise<{ houseId?: string; timeframe?: string }>;
}

interface RecentFeedTransactionItem {
  id: number | string;
  type: "INFLOW" | "OUTFLOW";
  amount: any;
  title: string;
  desc?: string | null;
  category: string;
  dateOfAdd: Date | string;
  createdAt?: Date | string;
  isFlagged?: boolean;
  house?: { name: string } | null;
}

export interface RecentFeedProps {
  transactions: RecentFeedTransactionItem[];
}
