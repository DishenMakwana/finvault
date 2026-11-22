"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-64 bg-background z-30 flex flex-col items-center justify-center overflow-hidden select-none px-4 py-12">
      {/* Dual ambient radial background glows */}
      <div className="w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none absolute -top-12 -left-12" />
      <div className="w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none absolute -bottom-12 -right-12" />

      {/* Main Glassmorphic Container with Staggered Motion */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Hero Floating Icon (Glassmorphic Token) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="relative mb-6"
        >
          {/* Outer glow */}
          <div className="absolute inset-0 bg-teal-500/20 rounded-3xl blur-xl animate-pulse" />

          {/* Inner glass tile */}
          <div className="relative border border-slate-800/80 bg-slate-900/60 rounded-3xl backdrop-blur-xl shadow-2xl w-24 h-24 flex items-center justify-center">
            <Compass className="text-teal-400 w-12 h-12 stroke-[1.5] animate-[spin_20s_linear_infinite]" />
          </div>
        </motion.div>

        {/* Error Code & Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="space-y-2 mb-3"
        >
          <span className="text-7xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 block leading-none">
            404
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            Vault Path Not Found
          </h2>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="text-sm font-medium text-slate-400 max-w-sm mx-auto leading-relaxed mb-8"
        >
          The ledger record, property vault, or transaction destination you are
          searching for does not exist, has been relocated, or is no longer
          accessible in the vault.
        </motion.p>

        {/* Action Button Group (Dual CTA) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          className="flex items-center justify-center gap-3 w-full sm:w-auto"
        >
          {/* Secondary Button: Go Back */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-slate-100 hover:border-slate-700 hover:bg-slate-800/80 font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Go Back</span>
          </button>

          {/* Primary Button: Dashboard / Home */}
          <Link
            href="/"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-teal-500/25 cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Go Dashboard</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
