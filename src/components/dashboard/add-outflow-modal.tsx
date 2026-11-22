"use client";

import React, { useState, useEffect } from "react";
import { Home, Tag } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  addTransactionAction,
  getUniqueCategories,
} from "@/lib/actions/cashflow.actions";
import { QuickModalProps } from "@/types/dashboard.types";

export function AddOutflowModal({
  isOpen,
  onClose,
  houses,
  defaultHouseId,
  categories: initialCategories,
}: QuickModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbCategories, setDbCategories] = useState<string[]>(
    initialCategories || []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setDbCategories(initialCategories);
    }
  }, [initialCategories]);

  useEffect(() => {
    if (isOpen) {
      getUniqueCategories("OUTFLOW").then((cats) => {
        if (cats && cats.length > 0) {
          setDbCategories(cats);
        }
      });
      setSelectedCategory("");
      setCustomCategory("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedCategory) {
      setError("Please select a Category.");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("type", "OUTFLOW");
    formData.set("category", selectedCategory);

    if (selectedCategory === "other") {
      const trimmedCustom = customCategory.trim();
      if (!trimmedCustom) {
        setError("Please enter a Category Name.");
        setLoading(false);
        return;
      }
      formData.set("category", trimmedCustom);
      formData.set("customCategory", trimmedCustom);
    }

    const res = await addTransactionAction(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const sortedCategories = [...dbCategories].sort((a, b) =>
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
      title="Record Cash Outflow"
      subtitle="Record outgoing cash expense from house balance"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            label="House / Property"
            name="houseId"
            defaultValue={
              defaultHouseId
                ? String(defaultHouseId)
                : String(houses[0]?.id || "")
            }
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
              required
              placeholder="e.g. 5000"
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-danger focus:ring-1 focus:ring-danger/20 transition-all duration-150"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            Title
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Car Insurance & Service"
            className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-danger focus:ring-1 focus:ring-danger/20 transition-all duration-150"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            label="Category"
            name="category"
            placeholder="Select Category"
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            required
            searchable
            icon={Tag}
            options={categoryOptions}
          />

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Date of Outflow
            </label>
            <input
              type="date"
              name="dateOfAdd"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-danger focus:ring-1 focus:ring-danger/20 transition-all duration-150"
            />
          </div>
        </div>

        {selectedCategory === "other" && (
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Category Name <span className="text-danger ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="customCategory"
              required
              autoFocus
              placeholder="Enter category name (e.g. Maintenance, Tax, Repairs...)"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-danger focus:ring-1 focus:ring-danger/20 transition-all duration-150"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            Description / Bill details
          </label>
          <textarea
            name="desc"
            rows={2}
            placeholder="Bill receipt number, doctor name, store details..."
            className="w-full bg-surface border border-border-muted rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-danger focus:ring-1 focus:ring-danger/20 transition-all duration-150 leading-relaxed resize-none"
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
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-danger hover:bg-danger/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Outflow"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
