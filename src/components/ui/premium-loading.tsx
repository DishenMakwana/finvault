"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  PremiumLoadingProps,
  LoadingTheme,
  LoadingSize,
} from "@/types/ui.types";

const THEME_STYLES: Record<
  LoadingTheme,
  {
    aura: string;
    outerRing: string;
    midArc: string;
    innerArc: string;
    coreOrb: string;
    glowShadow: string;
    pingDot: string;
    titleColor: string;
  }
> = {
  teal: {
    aura: "bg-teal-500/25",
    outerRing: "border-teal-500/30",
    midArc: "border-t-teal-400 border-r-teal-500",
    innerArc: "border-b-teal-300",
    coreOrb: "from-teal-400 via-teal-500 to-teal-700",
    glowShadow: "shadow-[0_0_20px_rgba(20,184,166,0.55)]",
    pingDot: "bg-teal-200",
    titleColor: "text-teal-400",
  },
  blue: {
    aura: "bg-blue-500/25",
    outerRing: "border-blue-500/30",
    midArc: "border-t-blue-400 border-r-blue-500",
    innerArc: "border-b-blue-300",
    coreOrb: "from-blue-400 via-blue-500 to-blue-700",
    glowShadow: "shadow-[0_0_20px_rgba(59,130,246,0.55)]",
    pingDot: "bg-blue-200",
    titleColor: "text-blue-400",
  },
  purple: {
    aura: "bg-purple-500/25",
    outerRing: "border-purple-500/30",
    midArc: "border-t-purple-400 border-r-purple-500",
    innerArc: "border-b-purple-300",
    coreOrb: "from-purple-400 via-purple-500 to-purple-700",
    glowShadow: "shadow-[0_0_20px_rgba(168,85,247,0.55)]",
    pingDot: "bg-purple-200",
    titleColor: "text-purple-400",
  },
  amber: {
    aura: "bg-amber-500/25",
    outerRing: "border-amber-500/30",
    midArc: "border-t-amber-400 border-r-amber-500",
    innerArc: "border-b-amber-300",
    coreOrb: "from-amber-400 via-amber-500 to-amber-700",
    glowShadow: "shadow-[0_0_20px_rgba(245,158,11,0.55)]",
    pingDot: "bg-amber-200",
    titleColor: "text-amber-400",
  },
  rose: {
    aura: "bg-rose-500/25",
    outerRing: "border-rose-500/30",
    midArc: "border-t-rose-400 border-r-rose-500",
    innerArc: "border-b-rose-300",
    coreOrb: "from-rose-400 via-rose-500 to-rose-700",
    glowShadow: "shadow-[0_0_20px_rgba(244,63,94,0.55)]",
    pingDot: "bg-rose-200",
    titleColor: "text-rose-400",
  },
};

const SIZE_CONFIGS: Record<
  LoadingSize,
  {
    container: string;
    aura: string;
    outerRing: string;
    midArc: string;
    innerArc: string;
    coreOrb: string;
    pingDot: string;
    titleSize: string;
    subtitleSize: string;
    gap: string;
  }
> = {
  sm: {
    container: "w-16 h-16",
    aura: "w-20 h-20",
    outerRing: "w-16 h-16",
    midArc: "w-12 h-12",
    innerArc: "w-8 h-8",
    coreOrb: "w-4 h-4",
    pingDot: "w-1.5 h-1.5",
    titleSize: "text-[10px]",
    subtitleSize: "text-[10px]",
    gap: "gap-3",
  },
  md: {
    container: "w-24 h-24",
    aura: "w-28 h-28",
    outerRing: "w-24 h-24",
    midArc: "w-[72px] h-[72px]",
    innerArc: "w-12 h-12",
    coreOrb: "w-6 h-6",
    pingDot: "w-2 h-2",
    titleSize: "text-xs",
    subtitleSize: "text-xs",
    gap: "gap-4",
  },
  lg: {
    container: "w-32 h-32",
    aura: "w-36 h-36",
    outerRing: "w-32 h-32",
    midArc: "w-24 h-24",
    innerArc: "w-16 h-16",
    coreOrb: "w-8 h-8",
    pingDot: "w-2.5 h-2.5",
    titleSize: "text-sm",
    subtitleSize: "text-xs",
    gap: "gap-5",
  },
};

export function PremiumLoading({
  title = "Loading Data",
  subtitle,
  theme = "teal",
  size = "md",
  fullScreen = false,
  className = "",
}: PremiumLoadingProps) {
  const styles = THEME_STYLES[theme] || THEME_STYLES.teal;
  const sizes = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  const content = (
    <div
      className={`flex flex-col items-center justify-center ${sizes.gap} ${className}`}
    >
      {/* Visual Orbital Assembly */}
      <div
        className={`relative flex items-center justify-center ${sizes.container}`}
      >
        {/* 1. Ambient Aura: blur-2xl, pulsing opacity & subtle scale */}
        <motion.div
          animate={{
            opacity: [0.35, 0.75, 0.35],
            scale: [0.95, 1.15, 0.95],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute inset-0 m-auto rounded-full blur-2xl pointer-events-none ${styles.aura} ${sizes.aura}`}
        />

        {/* 2. Outer Ring: 3s clockwise linear infinite rotation, dashed low opacity */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`absolute inset-0 m-auto rounded-full border border-dashed ${styles.outerRing} ${sizes.outerRing}`}
        />

        {/* 3. Mid-Level Arc: 1.5s counter-clockwise linear rotation, border-2 transparent with top & right accent */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`absolute inset-0 m-auto rounded-full border-2 border-transparent ${styles.midArc} ${sizes.midArc}`}
        />

        {/* 4. Inner Arc: 0.8s fast clockwise linear rotation, transparent with bottom accent active */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`absolute inset-0 m-auto rounded-full border-2 border-transparent ${styles.innerArc} ${sizes.innerArc}`}
        />

        {/* 5. Center Core Orb: 2s easeInOut breathing scale [0.9 to 1.1 to 0.9] with radial gradient, glow shadow, and inner animate-ping dot */}
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`relative rounded-full bg-gradient-to-tr ${styles.coreOrb} ${styles.glowShadow} ${sizes.coreOrb} flex items-center justify-center`}
        >
          <span
            className={`inline-block rounded-full animate-ping opacity-75 ${styles.pingDot} ${sizes.pingDot}`}
          />
        </motion.div>
      </div>

      {/* 6. Typography: Uppercase bold tracking [0.25em] title with breathing opacity [0.4 to 1 to 0.4] and subtle slate-500 subtitle */}
      <div className="flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <motion.h4
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`font-bold tracking-[0.25em] uppercase ${styles.titleColor} ${sizes.titleSize}`}
        >
          {title}
        </motion.h4>
        {subtitle && (
          <p
            className={`mt-1 font-medium text-slate-500 tracking-normal ${sizes.subtitleSize}`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/85 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}
