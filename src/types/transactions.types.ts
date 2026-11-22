export type DatePreset =
  "all" | "today" | "yesterday" | "week" | "month" | "last_month" | "year";

export type TransactionSortField =
  "date" | "title" | "house" | "category" | "type" | "amount";

export type SortOrder = "asc" | "desc";

export interface TransactionTableItem {
  id: number | string;
  type: "INFLOW" | "OUTFLOW";
  amount: any;
  title: string;
  desc?: string | null;
  category: string;
  dateOfAdd: Date | string;
  createdAt?: Date | string;
  deletedAt?: Date | string | null;
  isFlagged?: boolean;
  houseId?: number | string;
  house?: { id?: number | string; name: string } | null;
}

export interface TransactionTableProps {
  transactions: TransactionTableItem[];
  houses?: { id: number | string; name: string }[];
  inflowCategories?: string[];
  outflowCategories?: string[];
}

export interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionTableItem | null;
  houses: { id: number | string; name: string }[];
  inflowCategories?: string[];
  outflowCategories?: string[];
}

export interface TransactionFilterOptions {
  houseId?: number | string;
  type?: "ALL" | "INFLOW" | "OUTFLOW";
  category?: string | string[];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean;
  isFlagged?: boolean;
  flaggedOnly?: boolean;
}

export interface FilterBarProps {
  houses: { id: number | string; name: string }[];
  categories: string[];
  totalCount?: number;
  defaultHouseId?: string;
}

export interface TransactionActionsProps {
  houses: {
    id: number | string;
    name: string;
    isOwner?: boolean;
    userId?: number;
  }[];
  inflowCategories?: string[];
  outflowCategories?: string[];
  defaultHouseId?: string | number;
}

export interface UploadStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SyncStats {
  added: number;
  updated: number;
  skipped: number;
  total: number;
}

export interface TransactionsPageProps {
  searchParams: Promise<{
    houseId?: string;
    type?: "ALL" | "INFLOW" | "OUTFLOW";
    category?: string | string[];
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    flagged?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export interface ExportTransactionItem {
  id: number | string;
  date: string | Date;
  title: string;
  desc?: string | null;
  category: string;
  houseName: string;
  type: "INFLOW" | "OUTFLOW";
  amount: number;
  isFlagged?: boolean;
  createdAt: string | Date;
}

export interface FilterActiveChip {
  id: string;
  label: string;
  icon?: any;
  onRemove: () => void;
}
