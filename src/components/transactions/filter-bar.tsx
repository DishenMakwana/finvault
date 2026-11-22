"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Calendar,
  ChevronDown,
  Download,
  X,
  Home,
  ArrowLeftRight,
  Tag,
  Coins,
  Flag,
} from "lucide-react";
import {
  FilterBarProps,
  DatePreset,
  FilterActiveChip,
} from "@/types/transactions.types";
import { useUserStore } from "@/stores/use-user-store";

export function FilterBar({
  houses,
  categories,
  totalCount,
  defaultHouseId,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active filter state from URL (falls back to user's home as default)
  const activeSearch = searchParams.get("search") || "";
  const rawHouseId = searchParams.get("houseId");
  const activeHouseId =
    rawHouseId !== null ? rawHouseId : defaultHouseId || "ALL";
  const activeType = searchParams.get("type") || "ALL";
  const activeCategoryParam = searchParams.get("category") || "ALL";
  const selectedCategories = useMemo(
    () =>
      activeCategoryParam === "ALL" || !activeCategoryParam
        ? []
        : activeCategoryParam
            .split(",")
            .map((c) => c.trim().toLowerCase())
            .filter(Boolean),
    [activeCategoryParam]
  );
  const activeStartDate = searchParams.get("startDate") || "";
  const activeEndDate = searchParams.get("endDate") || "";
  const activeMinAmount = searchParams.get("minAmount") || "";
  const activeMaxAmount = searchParams.get("maxAmount") || "";
  const rawFlagged = searchParams.get("flagged");
  const activeFlaggedStatus: "ALL" | "FLAGGED" | "UNFLAGGED" =
    rawFlagged === "true"
      ? "FLAGGED"
      : rawFlagged === "false"
        ? "UNFLAGGED"
        : "ALL";

  // Local draft states
  const [searchInput, setSearchInput] = useState(activeSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modal draft selections
  const [modalHouseId, setModalHouseId] = useState(activeHouseId);
  const [modalType, setModalType] = useState(activeType);
  const [modalCategories, setModalCategories] = useState<string[]>([]);
  const [modalMinAmount, setModalMinAmount] = useState(activeMinAmount);
  const [modalMaxAmount, setModalMaxAmount] = useState(activeMaxAmount);
  const [modalFlagged, setModalFlagged] = useState<
    "ALL" | "FLAGGED" | "UNFLAGGED"
  >(activeFlaggedStatus);

  // Open modal and initialize draft state with currently active filters
  const handleOpenModal = () => {
    setModalHouseId(activeHouseId);
    setModalType(activeType);
    setModalCategories(selectedCategories);
    setModalMinAmount(activeMinAmount);
    setModalMaxAmount(activeMaxAmount);
    setModalFlagged(activeFlaggedStatus);
    setIsModalOpen(true);
  };

  const presetsRef = useRef<HTMLDivElement>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const formatPillDate = (isoDate: string) => {
    if (!isoDate) return "dd/mm/yyyy";
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Push new params to router
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val.trim() === "") {
        params.delete(key);
      } else if (key === "houseId" && val === "ALL") {
        params.set("houseId", "ALL");
      } else if (val === "ALL") {
        params.delete(key);
      } else {
        params.set(key, val.trim());
      }
    });
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  // Sync draft states when URL changes
  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch]);

  // Debounced 300ms URL synchronization
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== activeSearch.trim()) {
        updateQuery({
          search: searchInput.trim() ? searchInput.trim() : null,
          page: "1",
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, activeSearch]);

  // Date presets logic
  const handleSelectPreset = (preset: DatePreset) => {
    setIsPresetsOpen(false);
    const today = new Date();
    const formatDateStr = (d: Date) => d.toISOString().split("T")[0];

    let start = "";
    let end = "";

    if (preset === "today") {
      start = end = formatDateStr(today);
    } else if (preset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = end = formatDateStr(y);
    } else if (preset === "week") {
      const day = today.getDay();
      const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diffToMonday));
      start = formatDateStr(monday);
      end = formatDateStr(new Date());
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      start = formatDateStr(firstDay);
      end = formatDateStr(new Date());
    } else if (preset === "last_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      start = formatDateStr(firstDay);
      end = formatDateStr(lastDay);
    } else if (preset === "year") {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      start = formatDateStr(firstDay);
      end = formatDateStr(new Date());
    } else if (preset === "all") {
      start = "";
      end = "";
    }

    updateQuery({ startDate: start, endDate: end });
  };

  // Apply modal filters
  const handleApplyModalFilters = () => {
    if (modalHouseId) {
      useUserStore.getState().setActiveHouseId(modalHouseId);
    }
    updateQuery({
      houseId: modalHouseId,
      type: modalType,
      category: modalCategories.length > 0 ? modalCategories.join(",") : "ALL",
      minAmount: modalMinAmount.trim() ? modalMinAmount.trim() : null,
      maxAmount: modalMaxAmount.trim() ? modalMaxAmount.trim() : null,
      flagged:
        modalFlagged === "FLAGGED"
          ? "true"
          : modalFlagged === "UNFLAGGED"
            ? "false"
            : null,
      page: "1",
    });
    setIsModalOpen(false);
  };

  // Reset all filters
  const handleClearAll = () => {
    useUserStore.getState().setActiveHouseId("ALL");
    setSearchInput("");
    setModalHouseId("ALL");
    setModalType("ALL");
    setModalCategories([]);
    setModalMinAmount("");
    setModalMaxAmount("");
    setModalFlagged("ALL");
    const params = new URLSearchParams();
    params.set("houseId", "ALL");
    router.push(`${pathname}?${params.toString()}`);
    setIsModalOpen(false);
  };

  // Export to XLSX
  const handleExportXLSX = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("houseId") && activeHouseId !== "ALL") {
        params.set("houseId", activeHouseId);
      }
      const url = `/api/export/transactions?${params.toString()}`;
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = url;
    } catch {
      alert("Failed to trigger export. Please try again.");
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  // Calculate active filters count for the "Filters" button badge
  let activeFilterCount = 0;
  if (activeHouseId !== "ALL") activeFilterCount++;
  if (activeType !== "ALL") activeFilterCount++;
  if (selectedCategories.length > 0) activeFilterCount++;
  if (activeMinAmount || activeMaxAmount) activeFilterCount++;
  if (activeFlaggedStatus !== "ALL") activeFilterCount++;

  // Selected house display name
  const selectedHouseObj = houses.find(
    (h) => String(h.id) === String(activeHouseId)
  );

  // Determine active chips
  const activeChips: FilterActiveChip[] = [];
  if (selectedHouseObj && activeHouseId !== "ALL") {
    activeChips.push({
      id: "house",
      label: selectedHouseObj.name,
      icon: Home,
      onRemove: () => {
        useUserStore.getState().setActiveHouseId("ALL");
        updateQuery({ houseId: "ALL" });
      },
    });
  }
  if (activeType !== "ALL") {
    activeChips.push({
      id: "type",
      label: activeType === "INFLOW" ? "Inflow (+)" : "Outflow (-)",
      icon: ArrowLeftRight,
      onRemove: () => updateQuery({ type: null }),
    });
  }
  if (selectedCategories.length > 0) {
    selectedCategories.forEach((cat) => {
      activeChips.push({
        id: `category-${cat}`,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        icon: Tag,
        onRemove: () => {
          const remaining = selectedCategories.filter((c) => c !== cat);
          updateQuery({
            category: remaining.length > 0 ? remaining.join(",") : null,
          });
        },
      });
    });
  }
  if (activeStartDate || activeEndDate) {
    activeChips.push({
      id: "date",
      label: `${activeStartDate || "Start"} to ${activeEndDate || "Now"}`,
      icon: Calendar,
      onRemove: () => updateQuery({ startDate: null, endDate: null }),
    });
  }
  if (activeMinAmount || activeMaxAmount) {
    activeChips.push({
      id: "amount",
      label: `₹${activeMinAmount || "0"} - ₹${activeMaxAmount || "∞"}`,
      icon: Coins,
      onRemove: () => updateQuery({ minAmount: null, maxAmount: null }),
    });
  }
  if (activeFlaggedStatus === "FLAGGED") {
    activeChips.push({
      id: "flagged",
      label: "Flagged for Discussion",
      icon: Flag,
      onRemove: () => updateQuery({ flagged: null }),
    });
  } else if (activeFlaggedStatus === "UNFLAGGED") {
    activeChips.push({
      id: "unflagged",
      label: "Unflagged Only",
      icon: Flag,
      onRemove: () => updateQuery({ flagged: null }),
    });
  }

  return (
    <div className="bg-card border border-border-subtle rounded-2xl p-4 shadow-xl space-y-3">
      {/* Top Search & Filter Module Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* 1. Search Bar */}
        <div className="relative flex-1 min-w-[260px] h-10 bg-surface border border-border-muted hover:border-border-contrast rounded-xl flex items-center px-3.5 transition-all focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
          <Search className="w-4 h-4 text-neutral-500 mr-2.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search scheme, sub category, folio or applicant..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateQuery({
                  search: searchInput.trim() ? searchInput.trim() : null,
                  page: "1",
                });
              }
            }}
            className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateQuery({ search: null, page: "1" });
              }}
              className="text-neutral-500 hover:text-white ml-2 flex-shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Redesigned Clean Date Range Picker Pill */}
        <div className="bg-surface border border-border-muted hover:border-border-contrast rounded-xl h-10 px-3.5 flex items-center text-xs transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0 mr-2" />

          {/* Start Date */}
          <div
            className="relative flex items-center cursor-pointer group"
            onClick={() => {
              try {
                startInputRef.current?.showPicker();
              } catch (_) {}
            }}
          >
            <span
              className={`text-xs font-mono tracking-wide transition-colors ${
                activeStartDate
                  ? "text-white font-medium"
                  : "text-neutral-400 group-hover:text-neutral-200"
              }`}
            >
              {formatPillDate(activeStartDate)}
            </span>
            <input
              ref={startInputRef}
              type="date"
              value={activeStartDate}
              onChange={(e) => updateQuery({ startDate: e.target.value })}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer [color-scheme:dark]"
              title="Start Date"
              aria-label="Start Date"
            />
          </div>

          <span className="text-neutral-500 select-none text-xs font-medium px-2.5">
            –
          </span>

          {/* End Date */}
          <div
            className="relative flex items-center cursor-pointer group"
            onClick={() => {
              try {
                endInputRef.current?.showPicker();
              } catch (_) {}
            }}
          >
            <span
              className={`text-xs font-mono tracking-wide transition-colors ${
                activeEndDate
                  ? "text-white font-medium"
                  : "text-neutral-400 group-hover:text-neutral-200"
              }`}
            >
              {formatPillDate(activeEndDate)}
            </span>
            <input
              ref={endInputRef}
              type="date"
              value={activeEndDate}
              onChange={(e) => updateQuery({ endDate: e.target.value })}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer [color-scheme:dark]"
              title="End Date"
              aria-label="End Date"
            />
          </div>

          {/* Clear Dates Button */}
          {(activeStartDate || activeEndDate) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateQuery({ startDate: null, endDate: null });
              }}
              className="ml-2.5 text-neutral-400 hover:text-white transition-colors p-0.5 rounded-full hover:bg-surface-hover"
              title="Clear date range"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Presets Dropdown */}
        <div className="relative" ref={presetsRef}>
          <button
            type="button"
            onClick={() => setIsPresetsOpen(!isPresetsOpen)}
            className={`h-10 bg-surface hover:bg-surface-hover active:bg-surface-elevated border rounded-xl px-3.5 text-xs font-medium flex items-center gap-2 transition-colors ${
              isPresetsOpen || (activeStartDate && activeEndDate)
                ? "border-primary/60 text-white"
                : "border-border-muted text-neutral-300"
            }`}
          >
            <span>Presets</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isPresetsOpen ? "rotate-180 text-primary" : ""}`}
            />
          </button>

          <AnimatePresence>
            {isPresetsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 z-50 mt-1.5 w-44 bg-surface-modal border border-border-muted rounded-xl shadow-2xl p-1 text-xs"
              >
                <div className="space-y-0.5">
                  {[
                    { key: "all", label: "All Time" },
                    { key: "today", label: "Today" },
                    { key: "yesterday", label: "Yesterday" },
                    { key: "week", label: "This Week" },
                    { key: "month", label: "This Month" },
                    { key: "last_month", label: "Last Month" },
                    { key: "year", label: "This Year (YTD)" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleSelectPreset(p.key as DatePreset)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-surface-hover transition-colors flex items-center justify-between"
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Filters Button (Opens Modal with Badge) */}
        <button
          type="button"
          onClick={handleOpenModal}
          className={`h-10 relative flex items-center gap-2 px-3.5 rounded-xl text-xs font-semibold border transition-all ${
            activeFilterCount > 0
              ? "bg-primary-tint border-primary text-primary shadow-sm shadow-primary/10"
              : "bg-surface hover:bg-surface-hover border-border-muted text-neutral-300 hover:text-white"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-black text-[10px] font-bold flex items-center justify-center -mr-1">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* 5. Export Button */}
        <button
          type="button"
          onClick={handleExportXLSX}
          disabled={isExporting}
          className="h-10 flex items-center gap-1.5 bg-surface hover:bg-surface-hover active:bg-surface-elevated border border-border-muted hover:border-border-contrast text-neutral-200 hover:text-white px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
          <span>{isExporting ? "Exporting..." : "Export XLSX"}</span>
        </button>
      </div>

      {/* Active Filter Chips Row (Matches Image 1) */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-active">
          {activeChips.map((chip) => {
            const Icon = chip.icon;
            return (
              <div
                key={chip.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-tint border border-primary/60 text-primary shadow-sm select-none"
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="hover:text-white transition-colors ml-0.5"
                  title="Remove filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-neutral-400 hover:text-white font-medium ml-1.5 transition-colors cursor-pointer"
          >
            Clear all
          </button>

          {totalCount !== undefined && (
            <span className="text-[11px] font-mono text-neutral-400 ml-auto hidden sm:inline-block">
              {totalCount} transaction{totalCount === 1 ? "" : "s"} found
            </span>
          )}
        </div>
      )}

      {/* Filter Modal Dialog (Matching Image 2: "Transactions Tab Filters") */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-xl rounded-2xl bg-surface-modal border border-border-subtle shadow-2xl p-6 text-white z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Transactions Tab Filters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-surface-hover transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Body */}
              <div className="py-5 space-y-6">
                {/* 1. House / Property Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      House / Property
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-surface-pill border border-border-active text-neutral-400 px-2 py-0.5 rounded">
                      Single Select
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setModalHouseId("ALL")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        modalHouseId === "ALL"
                          ? "bg-primary-tint border border-primary text-primary font-semibold"
                          : "bg-surface border border-border-muted text-neutral-300 hover:text-white hover:border-border-contrast"
                      }`}
                    >
                      All Houses
                    </button>
                    {houses.map((h) => {
                      const isSelected = String(modalHouseId) === String(h.id);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setModalHouseId(String(h.id))}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-primary-tint border border-primary text-primary font-semibold"
                              : "bg-surface border border-border-muted text-neutral-300 hover:text-white hover:border-border-contrast"
                          }`}
                        >
                          {h.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Transaction Type Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Transaction Type
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-surface-pill border border-border-active text-neutral-400 px-2 py-0.5 rounded">
                      Single Select
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "ALL", label: "All Types" },
                      { key: "INFLOW", label: "Inflow (+)" },
                      { key: "OUTFLOW", label: "Outflow (-)" },
                    ].map((t) => {
                      const isSelected = modalType === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setModalType(t.key)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-primary-tint border border-primary text-primary font-semibold"
                              : "bg-surface border border-border-muted text-neutral-300 hover:text-white hover:border-border-contrast"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Category Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Category
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-surface-pill border border-border-active text-neutral-400 px-2 py-0.5 rounded">
                      MULTI SELECT
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
                    <button
                      type="button"
                      onClick={() => setModalCategories([])}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        modalCategories.length === 0
                          ? "bg-primary-tint border border-primary text-primary font-semibold"
                          : "bg-surface border border-border-muted text-neutral-300 hover:text-white hover:border-border-contrast"
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((c) => {
                      const lower = c.toLowerCase();
                      const isSelected = modalCategories.includes(lower);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setModalCategories((prev) =>
                              prev.includes(lower)
                                ? prev.filter((item) => item !== lower)
                                : [...prev, lower]
                            );
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                            isSelected
                              ? "bg-primary-tint border border-primary text-primary font-semibold"
                              : "bg-surface border border-border-muted text-neutral-300 hover:text-white hover:border-border-contrast"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Amount Range Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Amount Range (₹ INR)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Minimum Amount (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1000"
                        value={modalMinAmount}
                        onChange={(e) => setModalMinAmount(e.target.value)}
                        className="w-full bg-surface border border-border-muted rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Maximum Amount (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={modalMaxAmount}
                        onChange={(e) => setModalMaxAmount(e.target.value)}
                        className="w-full bg-surface border border-border-muted rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Family Discussion / Flag Status Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Flag className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Family Discussion / Flag Status
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-surface-pill border border-border-active text-neutral-400 px-2 py-0.5 rounded">
                      Single Select
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "ALL", label: "All Transactions" },
                      {
                        key: "FLAGGED",
                        label: "🚩 Flagged for Discussion",
                      },
                      { key: "UNFLAGGED", label: "Unflagged Only" },
                    ].map((f) => {
                      const isSelected = modalFlagged === f.key;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() =>
                            setModalFlagged(
                              f.key as "ALL" | "FLAGGED" | "UNFLAGGED"
                            )
                          }
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? f.key === "FLAGGED"
                                ? "bg-red-500/20 border border-red-500 text-red-400 font-semibold shadow-sm shadow-red-500/10"
                                : "bg-primary-tint border border-primary text-primary font-semibold"
                              : "bg-surface border border-border-muted text-neutral-300 hover:text-white hover:border-border-contrast"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setModalHouseId("ALL");
                    setModalType("ALL");
                    setModalCategories([]);
                    setModalMinAmount("");
                    setModalMaxAmount("");
                    setModalFlagged("ALL");
                  }}
                  className="text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Clear all
                </button>

                <button
                  type="button"
                  onClick={handleApplyModalFilters}
                  className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2 rounded-xl text-xs transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
