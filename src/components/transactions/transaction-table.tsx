"use client";

import React, { useMemo, useState, useDeferredValue } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Trash2,
  Pencil,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Flag,
} from "lucide-react";
import {
  softDeleteTransactionAction,
  restoreTransactionAction,
  toggleTransactionFlagAction,
} from "@/lib/actions/cashflow.actions";
import { formatINR, formatDateDMY } from "@/lib/formatters";
import { EditTransactionModal } from "@/components/transactions/edit-transaction-modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import {
  getSearchTokens,
  scoreTransactionAgainstTokens,
} from "@/helpers/search";
import { MatchScoreResult, SearchableField } from "@/types/search.types";
import {
  TransactionTableProps,
  TransactionTableItem,
  TransactionSortField,
  SortOrder,
} from "@/types/transactions.types";

export function TransactionTable({
  transactions,
  houses = [],
  inflowCategories,
  outflowCategories,
}: TransactionTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editingTx, setEditingTx] = useState<TransactionTableItem | null>(null);
  const [deletingTx, setDeletingTx] = useState<TransactionTableItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [optimisticFlags, setOptimisticFlags] = useState<
    Record<string | number, boolean>
  >({});

  // Read sort, pagination, and search params from URL
  const searchQuery = searchParams.get("search") || "";
  const deferredSearch = useDeferredValue(searchQuery);
  const tokens = useMemo(
    () => getSearchTokens(deferredSearch),
    [deferredSearch]
  );
  const isSearching = tokens.length > 0;

  const sortBy = (searchParams.get("sortBy") as TransactionSortField) || "date";
  const sortOrder = (searchParams.get("sortOrder") as SortOrder) || "desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const pageSizeParam = parseInt(searchParams.get("pageSize") || "25", 10);

  const pageSize = [10, 25, 50, 75, 100].includes(pageSizeParam)
    ? pageSizeParam
    : 25;

  // Stage 1: Boolean AND match filtering & scoring
  const { filteredTransactions, scoreMap } = useMemo(() => {
    const scores = new Map<string | number, MatchScoreResult>();

    const filtered = transactions.filter((t) => {
      if (!isSearching) return true;

      const fields: SearchableField[] = [
        { type: "TITLE", value: t.title || "" },
        { type: "CATEGORY", value: t.category || "" },
        { type: "HOUSE", value: t.house?.name || "" },
        { type: "DESCRIPTION", value: t.desc || "" },
        { type: "TYPE", value: t.type || "" },
      ];

      const scoreResult = scoreTransactionAgainstTokens(fields, tokens);
      if (scoreResult.matchedTermsCount < tokens.length) {
        return false;
      }

      scores.set(t.id, scoreResult);
      return true;
    });

    return { filteredTransactions: filtered, scoreMap: scores };
  }, [transactions, tokens, isSearching]);

  // Stage 2: Relevance-First Smart Sorting
  const sortedTransactions = useMemo(() => {
    const items = [...filteredTransactions];
    items.sort((a, b) => {
      if (isSearching) {
        const scoreA = scoreMap.get(a.id) || {
          matchedTermsCount: 0,
          totalScore: 0,
        };
        const scoreB = scoreMap.get(b.id) || {
          matchedTermsCount: 0,
          totalScore: 0,
        };

        // 1. Matched Tokens Count (Items matching more words appear first)
        if (scoreB.matchedTermsCount !== scoreA.matchedTermsCount) {
          return scoreB.matchedTermsCount - scoreA.matchedTermsCount;
        }

        // 2. Total Weighted Relevance Score (Exact & Title matches beat fuzzy/description matches)
        if (Math.abs(scoreB.totalScore - scoreA.totalScore) > 0.05) {
          return scoreB.totalScore - scoreA.totalScore;
        }
      }

      // 3. Fallback: User's selected column sort (or date desc tie-breaker)
      let comparison = 0;
      switch (sortBy) {
        case "date": {
          const timeA = new Date(a.dateOfAdd).getTime();
          const timeB = new Date(b.dateOfAdd).getTime();
          comparison = timeA - timeB;
          break;
        }
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
        case "house": {
          const houseA = a.house?.name || "";
          const houseB = b.house?.name || "";
          comparison = houseA.localeCompare(houseB);
          break;
        }
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "");
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "amount": {
          const amtA = Number(a.amount);
          const amtB = Number(b.amount);
          comparison = amtA - amtB;
          break;
        }
        default:
          comparison = 0;
      }
      if (comparison !== 0) {
        return sortOrder === "asc" ? comparison : -comparison;
      }

      // Tie-breaker: If same date (or identical field), always display last added first
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (createdA !== createdB) {
        return createdB - createdA;
      }

      const idA =
        typeof a.id === "number" ? a.id : parseInt(String(a.id), 10) || 0;
      const idB =
        typeof b.id === "number" ? b.id : parseInt(String(b.id), 10) || 0;
      return idB - idA;
    });
    return items;
  }, [filteredTransactions, scoreMap, isSearching, sortBy, sortOrder]);

  // Pagination calculations
  const totalRecords = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(Math.max(1, pageParam), totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + pageSize
  );

  const fromIndex = totalRecords === 0 ? 0 : startIndex + 1;
  const toIndex = Math.min(startIndex + pageSize, totalRecords);

  // Update URL parameters
  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSort = (field: TransactionSortField) => {
    let nextOrder: SortOrder = "asc";
    if (sortBy === field) {
      nextOrder = sortOrder === "asc" ? "desc" : "asc";
    } else if (field === "date" || field === "amount") {
      nextOrder = "desc";
    }
    updateUrl({
      sortBy: field,
      sortOrder: nextOrder,
      page: "1",
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateUrl({ page: String(newPage) });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    updateUrl({
      pageSize: String(newSize),
      page: "1",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    await softDeleteTransactionAction(deletingTx.id);
    setIsDeleting(false);
    setDeletingTx(null);
  };

  const handleRestore = async (id: number | string) => {
    await restoreTransactionAction(id);
  };

  const handleToggleFlag = async (
    id: number | string,
    currentFlagState: boolean
  ) => {
    const nextFlag = !currentFlagState;
    setOptimisticFlags((prev) => ({ ...prev, [id]: nextFlag }));

    try {
      const res = await toggleTransactionFlagAction(id, nextFlag);
      if (res?.error) {
        setOptimisticFlags((prev) => ({ ...prev, [id]: currentFlagState }));
      }
    } catch {
      setOptimisticFlags((prev) => ({ ...prev, [id]: currentFlagState }));
    }
  };

  // Render sorting arrows in column headers
  const renderSortIndicator = (field: TransactionSortField) => {
    if (sortBy === field) {
      return sortOrder === "asc" ? (
        <ChevronUp className="w-3.5 h-3.5 text-primary ml-1 flex-shrink-0 stroke-[2.5]" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-primary ml-1 flex-shrink-0 stroke-[2.5]" />
      );
    }
    return (
      <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-500 ml-1 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    );
  };

  // Generate pagination pages with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: number[] = [];
    pages.push(1);
    if (currentPage > 3) {
      pages.push(-1);
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) {
      pages.push(-1);
    }
    pages.push(totalPages);
    return pages;
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-card border border-border-subtle rounded-2xl p-12 text-center text-neutral-400 shadow-xl">
        <p className="text-sm font-semibold">
          No transactions match the selected filters.
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Try broadening your date range or clearing category filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border-subtle rounded-2xl shadow-xl overflow-hidden">
      {/* Top Pagination Status Bar (Matches Image 1) */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface/60 border-b border-border-subtle text-xs text-neutral-400">
        <div>
          <span>Page </span>
          <span className="font-bold text-white">{currentPage}</span>
          <span> of </span>
          <span className="font-bold text-white">{totalPages}</span>
        </div>
        <div>
          <span>Showing </span>
          <span className="font-bold text-white">
            {paginatedTransactions.length}
          </span>
          <span> of </span>
          <span className="font-bold text-white">{totalRecords}</span>
          <span> active transactions</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Table Header with Sortable Columns */}
          <thead className="bg-surface border-b border-border-subtle text-neutral-400 uppercase font-semibold text-[11px] tracking-wider select-none">
            <tr>
              <th className="py-3 px-4 w-12 text-neutral-500">#</th>

              {/* Date */}
              <th
                onClick={() => handleSort("date")}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center">
                  <span>Date</span>
                  {renderSortIndicator("date")}
                </div>
              </th>

              {/* Title & Details */}
              <th
                onClick={() => handleSort("title")}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center">
                  <span>Title & Details</span>
                  {renderSortIndicator("title")}
                </div>
              </th>

              {/* House */}
              <th
                onClick={() => handleSort("house")}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center">
                  <span>House</span>
                  {renderSortIndicator("house")}
                </div>
              </th>

              {/* Category */}
              <th
                onClick={() => handleSort("category")}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center">
                  <span>Category</span>
                  {renderSortIndicator("category")}
                </div>
              </th>

              {/* Type */}
              <th
                onClick={() => handleSort("type")}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center">
                  <span>Type</span>
                  {renderSortIndicator("type")}
                </div>
              </th>

              {/* Amount (INR) */}
              <th
                onClick={() => handleSort("amount")}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center justify-end">
                  <span>Amount (INR)</span>
                  {renderSortIndicator("amount")}
                </div>
              </th>

              {/* Actions */}
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border-active">
            {paginatedTransactions.map((tx, idx) => {
              const isInflow = tx.type === "INFLOW";
              const isDeleted = Boolean(tx.deletedAt);
              const isFlagged =
                optimisticFlags[tx.id] !== undefined
                  ? optimisticFlags[tx.id]
                  : Boolean(tx.isFlagged);
              const amt = Number(tx.amount);
              const rowNumber = startIndex + idx + 1;

              return (
                <tr
                  key={tx.id}
                  className={`hover:bg-surface-hover transition-colors ${
                    isDeleted
                      ? "opacity-40 bg-rose-950/10"
                      : isFlagged
                        ? "bg-red-950/10 hover:bg-red-950/20"
                        : ""
                  }`}
                >
                  {/* # */}
                  <td className="py-3.5 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                    {rowNumber}
                  </td>

                  {/* Date */}
                  <td
                    className="py-3.5 px-4 text-neutral-300 font-mono text-[11px] whitespace-nowrap"
                    suppressHydrationWarning
                  >
                    {formatDateDMY(tx.dateOfAdd)}
                  </td>

                  {/* Title & Desc */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white truncate">
                        {tx.title}
                      </p>
                      {isFlagged && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex-shrink-0">
                          <Flag className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                          <span>Discuss</span>
                        </span>
                      )}
                    </div>
                    {tx.desc && (
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {tx.desc}
                      </p>
                    )}
                  </td>

                  {/* House */}
                  <td className="py-3.5 px-4 text-neutral-300 whitespace-nowrap">
                    {tx.house?.name || "General"}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-surface-elevated text-neutral-300 border border-border-active">
                      {tx.category}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        isInflow
                          ? "text-primary bg-primary/10 border border-primary/20"
                          : "text-danger bg-danger/10 border border-danger/20"
                      }`}
                    >
                      {isInflow ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          <span>INFLOW</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3" />
                          <span>OUTFLOW</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Amount */}
                  <td
                    className={`py-3.5 px-4 text-right font-mono font-bold text-sm whitespace-nowrap ${
                      isInflow ? "text-primary" : "text-danger"
                    }`}
                  >
                    {isInflow ? "+" : "-"} {formatINR(amt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {isDeleted ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(tx.id)}
                        title="Restore Deleted Record"
                        className="p-1 rounded text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(tx.id, isFlagged)}
                          title={
                            isFlagged
                              ? "Flagged for family discussion (Click to unflag)"
                              : "Flag for family discussion"
                          }
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isFlagged
                              ? "text-red-500 bg-red-500/15 hover:bg-red-500/25"
                              : "text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
                          }`}
                        >
                          <Flag
                            className={`w-3.5 h-3.5 ${
                              isFlagged ? "fill-red-500 text-red-500" : ""
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTx(tx)}
                          title="Edit Transaction"
                          className="p-1 rounded text-neutral-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTx(tx)}
                          title="Delete Record"
                          className="p-1 rounded text-slate-500 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Control Bar (Matches Image 2) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-surface/80 border-t border-border-subtle text-xs text-neutral-400">
        {/* Left: Showing X to Y of Z */}
        <div>
          Showing <span className="font-bold text-white">{fromIndex}</span> to{" "}
          <span className="font-bold text-white">{toIndex}</span> of{" "}
          <span className="font-bold text-white">{totalRecords}</span>{" "}
          transactions
        </div>

        {/* Center: Page Size Selector */}
        <div className="flex items-center gap-2">
          <span>Page Size:</span>
          <div className="flex items-center gap-1">
            {[10, 25, 50, 75, 100].map((size) => {
              const isSelected = pageSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handlePageSizeChange(size)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary-tint border border-primary text-primary"
                      : "bg-card hover:bg-surface-hover border border-border-muted text-neutral-400 hover:text-white"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Previous, Page Numbers, Next */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-card border border-border-muted hover:bg-surface-hover hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>

          {getPageNumbers().map((p, i) => {
            if (p === -1) {
              return (
                <span key={`ellipsis-${i}`} className="px-1.5 text-neutral-500">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePageChange(p)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-primary text-black font-bold shadow-sm"
                    : "bg-card border border-border-muted text-neutral-300 hover:text-white hover:bg-surface-hover"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-card border border-border-muted hover:bg-surface-hover hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <EditTransactionModal
          key={editingTx.id}
          isOpen={Boolean(editingTx)}
          onClose={() => setEditingTx(null)}
          transaction={editingTx}
          houses={houses}
          inflowCategories={inflowCategories}
          outflowCategories={outflowCategories}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingTx)}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Transaction?"
        description={
          <span>
            Are you sure you want to delete{" "}
            <strong className="text-white font-semibold">
              {deletingTx?.title}
            </strong>
            ? This will soft-delete the transaction from active cash
            calculations.
          </span>
        }
        confirmLabel="Delete Record"
      />
    </div>
  );
}
