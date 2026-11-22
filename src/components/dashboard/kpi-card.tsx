"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  HandCoins,
  ShieldCheck,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
} from "lucide-react";
import { KpiCardProps } from "@/types/dashboard.types";

const ICON_MAP: Record<string, LucideIcon> = {
  cash: IndianRupee,
  rupee: IndianRupee,
  inflow: TrendingUp,
  "trending-up": TrendingUp,
  outflow: TrendingDown,
  "trending-down": TrendingDown,
  loans: HandCoins,
  "hand-coins": HandCoins,
  sessions: ShieldCheck,
  "shield-check": ShieldCheck,
  check: CheckCircle2,
  "check-circle": CheckCircle2,
  alert: AlertTriangle,
  warning: AlertTriangle,
  clock: Clock,
};

export function KpiCard({
  label,
  value,
  icon: PropIcon,
  iconName,
  iconColor,
  iconBg,
  iconBorder,
  deltaText,
  deltaType = "neutral",
  subtext,
  index = 0,
}: KpiCardProps) {
  const Icon = (iconName ? ICON_MAP[iconName] : PropIcon) || Coins;

  // Dribbble/Pinterest Glow Color Resolver
  const getGlowColor = () => {
    if (iconName === "cash" || deltaType === "positive") return "bg-primary";
    if (iconName === "outflow" || deltaType === "negative") return "bg-danger";
    if (iconName === "loans") return "bg-loan-light";
    if (iconName === "sessions") return "bg-cyan";
    return "bg-primary";
  };

  const getDeltaBadgeClass = () => {
    if (deltaType === "positive")
      return "text-primary bg-primary-tint border-primary/40";
    if (deltaType === "negative")
      return "text-danger bg-danger-tint border-danger/40";
    return "text-neutral-300 bg-surface-hover border-border-muted";
  };

  // Parse currency value to prevent wrapping and colorize +/- signs
  // Use exact same font size across all Cr, Lakh, and non-currency values for uniform visual rhythm
  const renderValue = () => {
    const isRupee = value.includes("₹");
    const hasPlus = value.startsWith("+");
    const hasMinus = value.startsWith("-");
    const valueSizeClass = "text-xl xl:text-xl 2xl:text-2xl";

    if (isRupee) {
      const rawNumber = value.replace(/^[+-]?\s*₹\s*/, "");

      return (
        <div className="flex items-baseline whitespace-nowrap overflow-hidden leading-none">
          {hasPlus && (
            <span
              className={`font-extrabold text-primary mr-1 select-none flex-shrink-0 leading-none ${valueSizeClass}`}
            >
              +
            </span>
          )}
          {hasMinus && (
            <span
              className={`font-extrabold text-danger mr-1 select-none flex-shrink-0 leading-none ${valueSizeClass}`}
            >
              -
            </span>
          )}
          <span
            className={`font-mono font-extrabold text-white mr-1.5 select-none flex-shrink-0 leading-none ${valueSizeClass}`}
          >
            ₹
          </span>
          <span
            className={`font-mono font-extrabold tracking-tight text-white truncate leading-none ${valueSizeClass}`}
            title={value}
          >
            {rawNumber}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-baseline whitespace-nowrap overflow-hidden leading-none">
        {hasPlus && (
          <span
            className={`font-extrabold text-primary mr-1 select-none flex-shrink-0 leading-none ${valueSizeClass}`}
          >
            +
          </span>
        )}
        {hasMinus && (
          <span
            className={`font-extrabold text-danger mr-1 select-none flex-shrink-0 leading-none ${valueSizeClass}`}
          >
            -
          </span>
        )}
        <span
          className={`font-mono font-extrabold tracking-tight text-white truncate leading-none ${valueSizeClass}`}
          title={value}
        >
          {value.replace(/^[+-]\s*/, "")}
        </span>
      </div>
    );
  };

  const hasSubKeyValue = Boolean(subtext && subtext.includes(":"));
  const [subKey, ...subValParts] =
    hasSubKeyValue && subtext ? subtext.split(":") : ["", ""];
  const subVal = subValParts.join(":").trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="relative bg-gradient-to-b from-surface to-background border border-border-subtle hover:border-border-contrast rounded-2xl p-4 shadow-xl transition-all flex flex-col justify-between h-full min-h-[148px] overflow-hidden group"
    >
      {/* Ambient Top Glow (Dribbble Glass Accent) */}
      <div
        className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-15 group-hover:opacity-30 ${getGlowColor()}`}
      />

      {/* Top Header: Label & Icon */}
      <div>
        <div className="h-8 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-400 tracking-tight leading-tight truncate">
            {label}
          </span>
          <motion.div
            whileHover={{ scale: 1.1, rotate: [-2, 2, 0] }}
            transition={{ duration: 0.2 }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm flex-shrink-0 transition-transform duration-200 ${iconBg} ${iconBorder} ${iconColor}`}
          >
            <Icon className="w-4 h-4" />
          </motion.div>
        </div>

        {/* Main Figure: Fixed-height vertical slot */}
        <div className="h-9 my-2 flex items-center">{renderValue()}</div>

        {/* Tag / Delta Badge: Fixed-height vertical slot so all cards align identically */}
        <div className="h-6 flex items-center">
          {deltaText && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${getDeltaBadgeClass()}`}
            >
              {deltaType === "positive" && (
                <ArrowUpRight className="w-3 h-3 text-primary flex-shrink-0" />
              )}
              {deltaType === "negative" && (
                <ArrowDownRight className="w-3 h-3 text-danger flex-shrink-0" />
              )}
              <span>{deltaText}</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom Sub-indicator: At the very bottom with fixed height */}
      <div className="pt-2 flex items-center justify-between mt-auto h-7">
        {hasSubKeyValue ? (
          <div className="flex items-center justify-between w-full text-[11px] px-0.5">
            <span className="text-neutral-400 font-medium tracking-tight">
              {subKey.trim()}:
            </span>
            <span
              className="font-mono font-semibold text-neutral-300 text-[11px] tracking-tight ml-2 truncate"
              title={subVal}
            >
              {subVal}
            </span>
          </div>
        ) : subtext ? (
          <div className="flex items-center justify-between w-full text-[11px] px-0.5">
            <span
              className="text-neutral-400 font-medium tracking-tight truncate"
              title={subtext}
            >
              {subtext}
            </span>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </motion.div>
  );
}
