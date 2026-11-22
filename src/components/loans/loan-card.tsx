"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Home,
} from "lucide-react";
import { RepaymentModal } from "./repayment-modal";
import { formatINR, formatDate } from "@/lib/formatters";
import { LoanCardProps } from "@/types/loans.types";

export function LoanCard({ loan, houses }: LoanCardProps) {
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const total = Number(loan.totalAmount);
  const paid = Number(loan.amountPaid);
  const remaining = Math.max(0, total - paid);
  const percentPaid =
    total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;
  const isFullyPaid = loan.status === "FULLY_PAID" || remaining === 0;

  // Check if next payment due date is upcoming or overdue
  let isOverdue = false;
  if (loan.nextPaymentDueDate && !isFullyPaid) {
    isOverdue = new Date(loan.nextPaymentDueDate) < new Date();
  }

  const getStatusBadge = () => {
    if (isFullyPaid) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-primary bg-primary/10 border border-primary/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Fully Settled</span>
        </span>
      );
    }
    if (loan.status === "PARTIALLY_PAID") {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>Partially Paid ({percentPaid}%)</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-loan-light bg-loan/10 border border-loan/20">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Pending (0%)</span>
      </span>
    );
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-card border border-border-subtle hover:border-border-hover rounded-2xl p-6 shadow-xl transition-all"
      >
        {/* Header: Relative Name & Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-bold text-base shadow-sm">
              {loan.relativeName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {loan.relativeName}
              </h3>
              <p
                className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5"
                suppressHydrationWarning
              >
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                Lent on {formatDate(loan.loanDate)}
                {loan.house && (
                  <>
                    <span>•</span>
                    <span className="text-neutral-300">
                      from {loan.house.name}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div>{getStatusBadge()}</div>
        </div>

        {/* Figures Grid */}
        <div className="grid grid-cols-3 gap-3 my-5 p-3 rounded-xl bg-surface border border-border-muted">
          <div>
            <p className="text-[10px] uppercase font-bold text-neutral-400">
              Total Loan
            </p>
            <p className="text-sm font-bold font-mono text-white mt-0.5">
              {formatINR(total)}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-neutral-400">
              Paid Back
            </p>
            <p className="text-sm font-bold font-mono text-primary mt-0.5">
              {formatINR(paid)}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-neutral-400">
              Remaining Balance
            </p>
            <p className="text-sm font-bold font-mono text-danger mt-0.5">
              {formatINR(remaining)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-neutral-400">Recovery Progress</span>
            <span className={isFullyPaid ? "text-primary" : "text-neutral-300"}>
              {percentPaid}% Paid
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-border-subtle overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullyPaid ? "bg-primary" : "bg-primary"
              }`}
              style={{ width: `${percentPaid}%` }}
            />
          </div>
        </div>

        {/* Next Payment Promise Banner */}
        {loan.nextPaymentDueDate && !isFullyPaid && (
          <div
            className={`p-2.5 rounded-xl text-xs font-medium mb-4 flex items-center justify-between border ${
              isOverdue
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {isOverdue
                ? "Payment Overdue Since:"
                : "Next Payment Promised On:"}
            </span>
            <span className="font-bold" suppressHydrationWarning>
              {formatDate(loan.nextPaymentDueDate)}
            </span>
          </div>
        )}

        {/* Notes */}
        {loan.notes && (
          <p className="text-xs text-slate-400 italic mb-4 line-clamp-2">
            &ldquo;{loan.notes}&rdquo;
          </p>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <span>{loan.repayments.length} Payments Recorded</span>
            {showHistory ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {!isFullyPaid && (
            <button
              type="button"
              onClick={() => setIsRepayOpen(true)}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Repayment</span>
            </button>
          )}
        </div>

        {/* Expandable Repayment History Timeline */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-3 border-t border-border-subtle space-y-2 overflow-hidden"
            >
              <h5 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Installment History Timeline
              </h5>
              {loan.repayments.length === 0 ? (
                <p className="text-xs text-neutral-500 py-2">
                  No payments logged yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {loan.repayments.map((r, index) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-xl bg-surface border border-border-muted flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            Payment #{loan.repayments.length - index}
                          </span>
                          <span
                            className="text-[11px] text-neutral-400"
                            suppressHydrationWarning
                          >
                            {formatDate(r.repaymentDate)}
                          </span>
                        </div>
                        {r.notes && (
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {r.notes}
                          </p>
                        )}
                        {r.house && (
                          <p className="text-[10px] text-neutral-500">
                            Into: {r.house.name}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-bold text-primary">
                        +{formatINR(Number(r.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Repayment Modal */}
      <RepaymentModal
        isOpen={isRepayOpen}
        onClose={() => setIsRepayOpen(false)}
        loan={loan}
        houses={houses}
      />
    </>
  );
}
