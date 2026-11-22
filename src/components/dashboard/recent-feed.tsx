"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Flag } from "lucide-react";
import { formatINR, formatDate } from "@/lib/formatters";
import { RecentFeedProps } from "@/types/dashboard.types";

export function RecentFeed({ transactions }: RecentFeedProps) {
  const displayTransactions = [...(transactions || [])]
    .sort((a, b) => {
      const dateDiff =
        new Date(b.dateOfAdd).getTime() - new Date(a.dateOfAdd).getTime();
      if (dateDiff !== 0) return dateDiff;
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (createdA !== createdB) return createdB - createdA;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    })
    .slice(0, 6);

  if (!displayTransactions || displayTransactions.length === 0) {
    return (
      <div className="bg-card border border-border-subtle rounded-2xl p-6 flex flex-col items-center justify-center text-neutral-400 h-64">
        <p className="text-sm">No recent transactions recorded.</p>
        <p className="text-xs text-neutral-500 mt-1">
          Use "+ Add Inflow" or "- Add Outflow" above to start logging.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: 0.2,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className="bg-card border border-border-subtle rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            Recent Activity Stream
          </h4>
          <p className="text-xs text-neutral-400">
            Latest 6 cash inflows and outflows (date desc)
          </p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-primary hover:underline"
        >
          View All Transactions →
        </Link>
      </div>

      <div className="space-y-2.5">
        {displayTransactions.map((tx) => {
          const isInflow = tx.type === "INFLOW";
          const amt = Number(tx.amount);

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-muted hover:border-border-hover transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    isInflow
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-danger/10 border-danger/20 text-danger"
                  }`}
                >
                  {isInflow ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white tracking-tight">
                      {tx.title}
                    </p>
                    {tx.isFlagged && (
                      <span
                        title="Flagged for family discussion"
                        className="inline-flex items-center p-0.5 rounded bg-red-500/15 text-red-500 flex-shrink-0"
                      >
                        <Flag className="w-3 h-3 fill-red-500 text-red-500" />
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-surface-elevated text-neutral-300 border border-border-active">
                      {tx.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                    <span suppressHydrationWarning>
                      {formatDate(tx.dateOfAdd)}
                    </span>
                    {tx.house && (
                      <>
                        <span>•</span>
                        <span>{tx.house.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <span
                  className={`text-sm font-mono font-bold ${
                    isInflow ? "text-primary" : "text-danger"
                  }`}
                >
                  {isInflow ? "+" : "-"} {formatINR(amt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
