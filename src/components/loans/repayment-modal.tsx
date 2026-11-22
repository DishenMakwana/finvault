"use client";

import { useState, type FormEvent } from "react";
import { Home } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { CustomSelect } from "@/components/ui/custom-select";
import { recordRepaymentAction } from "@/lib/actions/loan.actions";
import { formatINR } from "@/lib/formatters";
import { RepaymentModalProps } from "@/types/loans.types";

export function RepaymentModal({
  isOpen,
  onClose,
  loan,
  houses,
}: RepaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = Number(loan?.totalAmount || 0);
  const paid = Number(loan?.amountPaid || 0);
  const remaining = total - paid;

  const [amount, setAmount] = useState(
    remaining > 0 ? remaining.toString() : ""
  );

  if (!loan) return null;

  const handleFullSettlement = () => {
    setAmount(remaining.toString());
  };

  const handlePartialSplit = (divisor: number) => {
    setAmount((remaining / divisor).toFixed(2));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("loanId", String(loan.id));

    const res = await recordRepaymentAction(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Repayment — ${loan.relativeName}`}
      subtitle={`Remaining Balance: ${formatINR(remaining)} (Total Loan: ${formatINR(total)})`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Quick Presets (Single-shot vs Installments) */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            Repayment Quick Shortcuts
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleFullSettlement}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 transition-colors"
            >
              Full Settlement ({formatINR(remaining)})
            </button>
            {remaining >= 2000 && (
              <button
                type="button"
                onClick={() => handlePartialSplit(2)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-loan/15 hover:bg-loan/25 text-loan-light border border-loan/30 transition-colors"
              >
                Half Installment ({formatINR(remaining / 2)})
              </button>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Repayment Amount (₹ INR)
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              required
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>

          <CustomSelect
            label="Received Into House"
            name="houseId"
            icon={Home}
            options={[
              { value: "", label: "General Cash" },
              ...houses.map((h) => ({ value: String(h.id), label: h.name })),
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Date Repaid
            </label>
            <input
              type="date"
              name="repaymentDate"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Next Payment Promise Date
            </label>
            <input
              type="date"
              name="nextPaymentDueDate"
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            Notes / Receipt Remarks
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="e.g. Paid 50,000 in cash, promised remaining 50,000 next month..."
            className="w-full bg-surface border border-border-muted rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150 leading-relaxed resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 mt-6 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-black bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
