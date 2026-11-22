"use client";

import React, { useState, useEffect, useRef } from "react";
import { Home, Tag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  updateTransactionAction,
  getUniqueCategories,
} from "@/lib/actions/cashflow.actions";
import { EditTransactionModalProps } from "@/types/transactions.types";

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  houses,
  inflowCategories: initialInflowCats,
  outflowCategories: initialOutflowCats,
}: EditTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<"INFLOW" | "OUTFLOW">("INFLOW");
  const [houseId, setHouseId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [dateOfAdd, setDateOfAdd] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");

  const [inflowCats, setInflowCats] = useState<string[]>(
    initialInflowCats || []
  );
  const [outflowCats, setOutflowCats] = useState<string[]>(
    initialOutflowCats || []
  );

  const initializedTxId = useRef<number | string | null>(null);

  // Sync category lists only when props update
  useEffect(() => {
    if (initialInflowCats && initialInflowCats.length > 0) {
      setInflowCats(initialInflowCats);
    }
    if (initialOutflowCats && initialOutflowCats.length > 0) {
      setOutflowCats(initialOutflowCats);
    }
  }, [initialInflowCats, initialOutflowCats]);

  // Fetch unique categories from DB on modal open
  useEffect(() => {
    if (isOpen) {
      getUniqueCategories("INFLOW").then((cats) => {
        if (cats && cats.length > 0) setInflowCats(cats);
      });
      getUniqueCategories("OUTFLOW").then((cats) => {
        if (cats && cats.length > 0) setOutflowCats(cats);
      });
    }
  }, [isOpen]);

  // Initialize form state ONCE when opening a transaction (do not overwrite on keystrokes)
  useEffect(() => {
    if (isOpen && transaction && transaction.id !== initializedTxId.current) {
      initializedTxId.current = transaction.id;
      setError(null);
      const txType = transaction.type || "INFLOW";
      setType(txType);

      const targetHouseId =
        transaction.houseId !== undefined && transaction.houseId !== null
          ? String(transaction.houseId)
          : transaction.house &&
              "id" in transaction.house &&
              transaction.house.id
            ? String(transaction.house.id)
            : houses.find((h) => h.name === transaction.house?.name)?.id
              ? String(
                  houses.find((h) => h.name === transaction.house?.name)!.id
                )
              : String(houses[0]?.id || "");

      setHouseId(targetHouseId);
      setAmount(String(transaction.amount ?? ""));
      setTitle(transaction.title || "");
      setDesc(transaction.desc || "");

      // Format date to YYYY-MM-DD
      if (transaction.dateOfAdd) {
        try {
          const d = new Date(transaction.dateOfAdd);
          setDateOfAdd(d.toISOString().split("T")[0]);
        } catch {
          setDateOfAdd(new Date().toISOString().split("T")[0]);
        }
      } else {
        setDateOfAdd(new Date().toISOString().split("T")[0]);
      }

      // Determine category
      const activeCats =
        txType === "INFLOW"
          ? initialInflowCats || []
          : initialOutflowCats || [];
      const rawCategory = transaction.category
        ? transaction.category.trim()
        : "";
      const match = activeCats.find(
        (c) => c.toLowerCase() === rawCategory.toLowerCase()
      );

      if (match) {
        setSelectedCategory(match.toLowerCase());
        setCustomCategory("");
      } else if (rawCategory) {
        setSelectedCategory("other");
        setCustomCategory(rawCategory);
      } else {
        setSelectedCategory(activeCats[0]?.toLowerCase() || "other");
        setCustomCategory("");
      }
    }

    if (!isOpen) {
      initializedTxId.current = null;
    }
  }, [isOpen, transaction, houses, initialInflowCats, initialOutflowCats]);

  const activeCategories = type === "INFLOW" ? inflowCats : outflowCats;
  const defaultCat = activeCategories[0]?.toLowerCase() || "other";
  const effectiveCategory = selectedCategory || defaultCat;

  const handleTypeChange = (newType: "INFLOW" | "OUTFLOW") => {
    setType(newType);
    const newCats = newType === "INFLOW" ? inflowCats : outflowCats;
    setSelectedCategory(newCats[0]?.toLowerCase() || "other");
    setCustomCategory("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!transaction) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("id", String(transaction.id));
    formData.set("type", type);
    formData.set("houseId", houseId);
    formData.set("amount", amount);
    formData.set("title", title);
    formData.set("desc", desc);
    formData.set("dateOfAdd", dateOfAdd);

    if (effectiveCategory === "other") {
      const trimmedCustom = customCategory.trim();
      if (!trimmedCustom) {
        setError("Please enter a Category Name.");
        setLoading(false);
        return;
      }
      formData.set("category", trimmedCustom);
      formData.set("customCategory", trimmedCustom);
    } else {
      const match = activeCategories.find(
        (c) => c.toLowerCase() === effectiveCategory.toLowerCase()
      );
      formData.set("category", match || effectiveCategory);
    }

    const res = await updateTransactionAction(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const sortedCategories = [...activeCategories].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  const categoryOptions = [
    ...sortedCategories.map((c) => ({
      value: c.toLowerCase(),
      label: c,
    })),
    { value: "other", label: "Other" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Transaction"
      subtitle="Update the details of this recorded cash transaction"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Type Switcher */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface rounded-xl border border-border-muted">
            <button
              type="button"
              onClick={() => handleTypeChange("INFLOW")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                type === "INFLOW"
                  ? "bg-primary text-black font-bold shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Inflow (Cash In)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("OUTFLOW")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                type === "OUTFLOW"
                  ? "bg-danger text-white font-bold shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Outflow (Cash Out)</span>
            </button>
          </div>
        </div>

        {/* House and Amount */}
        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            label="House / Property"
            name="houseId"
            value={houseId}
            onChange={(val) => setHouseId(val)}
            required
            icon={Home}
            options={houses.map((h) => ({
              value: String(h.id),
              label: h.name,
            }))}
          />

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Amount (₹ INR)
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g. 25000"
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Person Salary Shreeji Shop"
            className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
          />
        </div>

        {/* Category and Date */}
        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            label="Category"
            name="category"
            value={effectiveCategory}
            onChange={(val) => setSelectedCategory(val)}
            required
            searchable
            icon={Tag}
            options={categoryOptions}
          />

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Date of Cash Addition
            </label>
            <input
              type="date"
              name="dateOfAdd"
              value={dateOfAdd}
              onChange={(e) => setDateOfAdd(e.target.value)}
              required
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>
        </div>

        {/* Custom Category input if 'other' */}
        {effectiveCategory === "other" && (
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Category Name <span className="text-primary ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="customCategory"
              required
              autoFocus
              placeholder="Enter custom category name..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>
        )}

        {/* Description / Notes */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            Description / Notes (Optional)
          </label>
          <textarea
            name="desc"
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Additional details or notes..."
            className="w-full bg-surface border border-border-muted rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150 leading-relaxed resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white bg-surface hover:bg-surface-hover border border-border-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-black transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
