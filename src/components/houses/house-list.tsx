"use client";

import React, { useState } from "react";
import {
  Home,
  Plus,
  Calendar,
  Coins,
  User,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { createHouseAction } from "@/lib/actions/house.actions";
import { formatINR, formatDate } from "@/lib/formatters";
import { HouseListProps } from "@/types/houses.types";

export function HouseList({
  houses,
  totalCurrentCash,
  totalInitialCash,
}: HouseListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createHouseAction(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setIsAddOpen(false);
    }
  };

  const calculatedInitial = houses.reduce(
    (acc, h) => acc + Number(h.initialCash),
    0
  );
  const calculatedCurrent = houses.reduce(
    (acc, h) => acc + (h.currentCash ?? Number(h.initialCash)),
    0
  );

  const effectiveInitialTotal = totalInitialCash ?? calculatedInitial;
  const effectiveCurrentTotal = totalCurrentCash ?? calculatedCurrent;
  const totalDiff = effectiveCurrentTotal - effectiveInitialTotal;

  return (
    <>
      {/* Top Action & Total Summary (Current Cash as Primary) */}
      <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Coins className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Total Current Cash in Hand (All Houses)
              </p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                Live Balance
              </span>
            </div>
            <h3 className="text-3xl font-extrabold font-mono text-white mt-1">
              {formatINR(effectiveCurrentTotal)}
            </h3>
            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1.5">
              <span>Starting Baseline: {formatINR(effectiveInitialTotal)}</span>
              <span>•</span>
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${
                  totalDiff >= 0 ? "text-primary" : "text-danger"
                }`}
              >
                {totalDiff >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                <span>
                  {totalDiff >= 0 ? "+" : ""}
                  {formatINR(totalDiff)} Net Shift
                </span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-black px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New House</span>
        </button>
      </div>

      {/* Houses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {houses.map((house) => {
          const currentBalance = house.currentCash ?? Number(house.initialCash);
          const initialBalance = Number(house.initialCash);
          const diff = currentBalance - initialBalance;

          return (
            <div
              key={house.id}
              className="bg-card border border-border-subtle hover:border-border-hover rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header: Name, Address, Ownership */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-hover border border-border-muted flex items-center justify-center text-slate-200 shrink-0">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white tracking-tight truncate">
                        {house.name}
                      </h4>
                      {house.address && (
                        <p className="text-xs text-neutral-400 truncate max-w-[220px] mt-0.5">
                          {house.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ownership Tag */}
                  <div className="shrink-0">
                    {house.isOwner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 border border-primary/40 text-primary whitespace-nowrap">
                        <User className="w-2.5 h-2.5" />
                        Own House
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-pill border border-border-active text-neutral-400 whitespace-nowrap">
                        {house.ownerName
                          ? `Family • ${house.ownerName}`
                          : "Family Property"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Card Focus: Current Cash in Hand */}
                <div className="mt-4 p-4 rounded-xl bg-surface border border-border-muted">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                      Current Cash in Hand
                    </p>
                    <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Live Vault
                    </span>
                  </div>
                  <h4 className="text-2xl font-extrabold font-mono text-white mt-1.5 whitespace-nowrap">
                    {formatINR(currentBalance)}
                  </h4>

                  {/* Secondary Baseline Info Strip */}
                  <div className="mt-3 pt-2.5 border-t border-border-active flex flex-col gap-1 text-[11px] text-neutral-400">
                    <div className="flex items-center justify-between">
                      <span>Starting Baseline:</span>
                      <span className="font-mono text-neutral-300 font-medium">
                        {formatINR(initialBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-500">
                      <span
                        className="flex items-center gap-1"
                        suppressHydrationWarning
                      >
                        <Calendar className="w-3 h-3" />
                        Initialized on {formatDate(house.initialCashDate)}
                      </span>
                      {diff !== 0 && (
                        <span
                          className={`font-semibold ${
                            diff > 0 ? "text-primary" : "text-danger"
                          }`}
                        >
                          {diff > 0 ? `+${formatINR(diff)}` : formatINR(diff)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                <span className="text-neutral-400">Ledger Status:</span>
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Live Reconciled
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add House Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New House / Property"
        subtitle="Create a new household ledger with starting cash in hand"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              House Name
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Farm House, Village Home, Flat 402"
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Address / Location (Optional)
            </label>
            <input
              type="text"
              name="address"
              placeholder="e.g. Ring Road, Sector 5"
              className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Starting Cash in Hand (₹ INR)
              </label>
              <input
                type="number"
                step="0.01"
                name="initialCash"
                defaultValue="0"
                required
                className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Date of Initialization
              </label>
              <input
                type="date"
                name="initialCashDate"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
                className="w-full h-10 bg-surface border border-border-muted rounded-xl px-3.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 mt-6 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-black bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create House"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
