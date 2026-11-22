"use client";

import React, { useState } from "react";
import { Home } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { CustomSelect } from "@/components/ui/custom-select";
import { addLoanAction } from "@/lib/actions/loan.actions";
import { QuickModalProps } from "@/types/dashboard.types";

export function AddLoanModal({
  isOpen,
  onClose,
  houses,
  defaultHouseId,
}: QuickModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await addLoanAction(formData);
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
      title="Give Loan to Relative"
      subtitle="Record cash lent to relative with expected repayment date"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            Relative Name
          </label>
          <input
            type="text"
            name="relativeName"
            required
            placeholder="e.g. Relative Name (e.g. John Doe)"
            className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Total Amount Lent (₹ INR)
            </label>
            <input
              type="number"
              step="0.01"
              name="totalAmount"
              required
              placeholder="e.g. 100000"
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>

          <CustomSelect
            label="Source House (Cash taken from)"
            name="houseId"
            defaultValue={defaultHouseId ? String(defaultHouseId) : ""}
            icon={Home}
            options={[
              { value: "", label: "General / None" },
              ...houses.map((h) => ({ value: String(h.id), label: h.name })),
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Date Loan Given
            </label>
            <input
              type="date"
              name="loanDate"
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
            Notes / Terms
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Reason, promised installments (e.g. 50k in Diwali, 50k in New Year)..."
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
            {loading ? "Recording..." : "Record Loan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
