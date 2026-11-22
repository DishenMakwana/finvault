"use client";

import { useState } from "react";
import { Plus, Minus, Upload } from "lucide-react";
import { AddInflowModal } from "@/components/dashboard/add-inflow-modal";
import { AddOutflowModal } from "@/components/dashboard/add-outflow-modal";
import { UploadStatementModal } from "./upload-statement-modal";
import { TransactionActionsProps } from "@/types/transactions.types";

export function TransactionActions({
  houses,
  inflowCategories,
  outflowCategories,
  defaultHouseId: propDefaultHouseId,
}: TransactionActionsProps) {
  const [isInflowOpen, setIsInflowOpen] = useState(false);
  const [isOutflowOpen, setIsOutflowOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const defaultHouseId =
    propDefaultHouseId || houses.find((h) => h.isOwner)?.id || houses[0]?.id;

  return (
    <>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setIsInflowOpen(true)}
          className="flex items-center gap-1.5 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/40 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Inflow</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOutflowOpen(true)}
          className="flex items-center gap-1.5 bg-danger/15 hover:bg-danger/25 text-danger border border-danger/40 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Outflow</span>
        </button>

        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover active:scale-95 text-black px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-primary/20 cursor-pointer ml-1"
        >
          <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Upload Statement (.xlsx)</span>
        </button>
      </div>

      {/* Quick Inflow & Outflow Modals */}
      <AddInflowModal
        isOpen={isInflowOpen}
        onClose={() => setIsInflowOpen(false)}
        houses={houses}
        defaultHouseId={defaultHouseId}
        categories={inflowCategories}
      />
      <AddOutflowModal
        isOpen={isOutflowOpen}
        onClose={() => setIsOutflowOpen(false)}
        houses={houses}
        defaultHouseId={defaultHouseId}
        categories={outflowCategories}
      />

      {/* Upload Statement Modal */}
      <UploadStatementModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </>
  );
}
