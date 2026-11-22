interface LoanRepaymentItem {
  id: number | string;
  amount: any;
  repaymentDate: Date | string;
  notes?: string | null;
  house?: { name: string } | null;
}

interface LoanItem {
  id: number | string;
  relativeName: string;
  totalAmount: any;
  amountPaid: any;
  nextPaymentDueDate: Date | string | null;
  status: "PENDING" | "PARTIALLY_PAID" | "FULLY_PAID";
  notes?: string | null;
  loanDate: Date | string;
  house?: { name: string } | null;
  repayments: LoanRepaymentItem[];
}

export interface LoanCardProps {
  loan: LoanItem;
  houses: { id: number | string; name: string }[];
  index?: number;
}

export interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: {
    id: number | string;
    relativeName: string;
    totalAmount: any;
    amountPaid: any;
  } | null;
  houses: { id: number | string; name: string }[];
}

export interface LoanActionsProps {
  houses: {
    id: number | string;
    name: string;
    isOwner?: boolean;
    userId?: number;
  }[];
}

export interface LoansPageProps {
  searchParams: Promise<{ houseId?: string }>;
}
