"use client";

import { motion } from "framer-motion";
import { formatINR } from "@/lib/formatters";
import {
  CategoryBreakdownCardProps,
  CategoryBreakdownItem,
} from "@/types/dashboard.types";

export function CategoryBreakdownCard({
  categories,
  netFlow,
}: CategoryBreakdownCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
      className="bg-card border border-border-subtle rounded-2xl p-6 shadow-lg flex flex-col justify-between h-full"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white tracking-tight">
            Category Breakdown
          </h4>
          <span className="text-[11px] text-neutral-500">Top 5 by Value</span>
        </div>

        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-neutral-400">
                No categories recorded yet.
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Record transactions to populate.
              </p>
            </div>
          ) : (
            categories.map((cat: CategoryBreakdownItem, idx: number) => (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.25,
                  delay: 0.18 + idx * 0.04,
                  ease: "easeOut",
                }}
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border-muted transition-colors hover:border-neutral-700"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cat.type === "INFLOW" ? "bg-primary" : "bg-danger"
                    }`}
                  />
                  <span className="text-xs font-semibold text-white capitalize">
                    {cat.category}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    ({cat.count})
                  </span>
                </div>
                <span
                  className={`text-xs font-mono font-bold ${
                    cat.type === "INFLOW" ? "text-primary" : "text-danger"
                  }`}
                >
                  {formatINR(cat.total)}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border-subtle mt-4 flex items-center justify-between text-xs">
        <span className="text-neutral-400">Net Flow (In - Out):</span>
        <span
          className={`font-mono font-bold text-sm ${
            netFlow >= 0 ? "text-primary" : "text-danger"
          }`}
        >
          {netFlow >= 0 ? "+" : ""}
          {formatINR(netFlow)}
        </span>
      </div>
    </motion.div>
  );
}
