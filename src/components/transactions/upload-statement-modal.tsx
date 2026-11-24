"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Upload,
  X,
  CheckCircle2,
  RotateCw,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { syncTransactionsFromExcelAction } from "@/lib/actions/cashflow.actions";
import {
  UploadStatementModalProps,
  SyncStats,
} from "@/types/transactions.types";

export function UploadStatementModal({
  isOpen,
  onClose,
}: UploadStatementModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setError(null);
    setStats(null);
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validExtensions = [".xlsx", ".xls"];
    const isXlsx = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!isXlsx) {
      setError("Please select a valid Excel file (.xlsx or .xls).");
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSync = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await syncTransactionsFromExcelAction(formData);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else if (res.data) {
        setStats(res.data);
        setLoading(false);
      }
    } catch (err: unknown) {
      const error = err as Error | undefined;
      setError(error?.message || "An unexpected error occurred during sync.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="relative w-full max-w-lg bg-surface-modal border border-border-muted rounded-2xl shadow-2xl p-6 overflow-hidden"
      >
        {/* Header (Matches Screenshot 1 & 2) */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                Upload Transaction Statement
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Import or sync transactions from .xlsx statement file
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-2.5 text-xs text-danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{error}</span>
          </div>
        )}

        {/* Main Body */}
        <AnimatePresence mode="wait">
          {stats ? (
            /* State 3: Success State (Matches Screenshot 3) */
            <motion.div
              key="success-state"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-5"
            >
              {/* Green Success Banner */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-start sm:items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-xs sm:text-sm font-semibold text-primary leading-tight">
                  Statement Uploaded Successfully: {stats.added} newly added,{" "}
                  {stats.updated} updated, {stats.skipped} skipped (already
                  matched).
                </p>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* 1. Newly Added */}
                <div className="bg-surface border border-primary/25 rounded-xl p-3.5 text-center flex flex-col justify-center">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-primary leading-none mb-1.5">
                    +{stats.added}
                  </span>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">
                    Newly Added
                  </span>
                </div>

                {/* 2. Updated */}
                <div className="bg-surface border border-amber-500/25 rounded-xl p-3.5 text-center flex flex-col justify-center">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 leading-none mb-1.5">
                    ~{stats.updated}
                  </span>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">
                    Updated
                  </span>
                </div>

                {/* 3. Unchanged */}
                <div className="bg-surface border border-neutral-700/50 rounded-xl p-3.5 text-center flex flex-col justify-center">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-white leading-none mb-1.5">
                    ={stats.skipped}
                  </span>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">
                    Unchanged
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-hover text-neutral-200 border border-neutral-700/80 transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Upload Another</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-black transition-all cursor-pointer shadow-sm shadow-primary/10"
                >
                  Done
                </button>
              </div>
            </motion.div>
          ) : (
            /* Upload / File Select State (Matches Screenshot 1 & 2) */
            <motion.div
              key="upload-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Drag & Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                  selectedFile
                    ? "border-primary/60 bg-primary/5"
                    : isDragging
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-neutral-700/80 hover:border-neutral-500 bg-surface/40 hover:bg-surface/70"
                }`}
              >
                {selectedFile ? (
                  /* State 2: File Selected (Screenshot 2) */
                  <>
                    <FileSpreadsheet className="w-10 h-10 text-primary mb-3" />
                    <p className="text-xs sm:text-sm font-bold text-white max-w-sm truncate px-2">
                      {selectedFile.name}
                    </p>
                    <span className="text-xs text-neutral-400 font-mono mt-1">
                      {formatFileSize(selectedFile.size)}
                    </span>
                    <span className="text-[11px] text-primary/80 mt-2 hover:underline">
                      Click to choose another file
                    </span>
                  </>
                ) : (
                  /* State 1: Empty Drop Zone (Screenshot 1) */
                  <>
                    <Upload className="w-9 h-9 text-neutral-400 mb-3" />
                    <p className="text-xs sm:text-sm font-semibold text-white mb-1">
                      Drag and drop your transaction .xlsx statement file
                    </p>
                    <p className="text-xs text-neutral-400">
                      Click to browse from your computer (Date format:
                      DD/MM/YYYY)
                    </p>
                  </>
                )}
              </div>

              {/* Sample Template Link */}
              <div className="flex items-center justify-between text-xs px-1 text-neutral-400">
                <span>Need the format?</span>
                <a
                  href="/api/export/sample-transactions"
                  download="FinVault_Sample_Transaction_Statement.xlsx"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Excel (.xlsx)</span>
                </a>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-hover active:bg-surface-elevated text-neutral-300 hover:text-white border border-neutral-700/80 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSync}
                  disabled={!selectedFile || loading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    !selectedFile || loading
                      ? "bg-primary/40 text-neutral-900 cursor-not-allowed opacity-60"
                      : "bg-primary hover:bg-primary-hover text-black shadow-lg shadow-primary/20 cursor-pointer active:scale-95"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Sync Transactions</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
