"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import { AddLoanModal } from "@/components/dashboard/add-loan-modal";
import { LoanActionsProps } from "@/types/loans.types";

export function LoanActions({ houses }: LoanActionsProps) {
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const userHome = houses.find((h) => h.isOwner);
  const defaultHouseId = userHome ? String(userHome.id) : houses[0]?.id;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsLoanOpen(true)}
        className="flex items-center gap-1.5 bg-surface-hover hover:bg-surface-elevated text-neutral-200 border border-border-active rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
      >
        <HandCoins className="w-3.5 h-3.5 text-primary" />
        <span>Give Loan</span>
      </button>

      {/* Quick Loan Modal */}
      <AddLoanModal
        isOpen={isLoanOpen}
        onClose={() => setIsLoanOpen(false)}
        houses={houses}
        defaultHouseId={defaultHouseId}
      />
    </>
  );
}
