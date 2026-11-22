"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { ConfirmDeleteModalProps, SparkleStarProps } from "@/types/ui.types";

function SparkleStar({ className }: SparkleStarProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Record?",
  description,
  confirmLabel = "Delete Record",
  cancelLabel = "Cancel",
  loading = false,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-3xl bg-[#131316] border border-white/10 shadow-2xl p-7 pt-9 text-center text-white z-10 overflow-hidden"
          >
            {/* Soft Ambient Red Glow at Top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-24 bg-danger/15 blur-3xl pointer-events-none rounded-full" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Trash Icon Container with Sparkles */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Decorative Twinkle Sparkles */}
              <SparkleStar className="absolute top-0 left-1 w-3.5 h-3.5 text-danger/40" />
              <SparkleStar className="absolute top-1 right-2 w-3 h-3 text-danger/40" />
              <SparkleStar className="absolute bottom-1 left-0 w-3 h-3 text-danger/40" />
              <SparkleStar className="absolute bottom-2 right-1 w-3.5 h-3.5 text-danger/40" />

              {/* Radial Glow */}
              <div className="absolute inset-2 bg-danger/25 blur-xl rounded-2xl pointer-events-none" />

              {/* Icon Box */}
              <div className="relative w-20 h-20 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger shadow-inner">
                <Trash2 className="w-9 h-9 stroke-[1.75]" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white tracking-tight mt-6">
              {title}
            </h3>

            {/* Description */}
            {description && (
              <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed mt-2.5 max-w-sm mx-auto">
                {description}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 px-5 rounded-full border border-border-muted bg-surface/50 hover:bg-surface text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-3 px-5 rounded-full bg-danger hover:bg-danger/90 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-danger/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? "Deleting..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
