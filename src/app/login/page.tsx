"use client";

import React, { useState } from "react";
import { loginUser, registerUser } from "@/lib/actions/auth.actions";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const action = isRegister ? registerUser : loginUser;
    const res = await action(formData);

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border-subtle rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow ambient background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-black font-bold mb-3 shadow-lg shadow-primary/20">
            <TrendingUp className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            FinVault
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {isRegister
              ? "Create your FinVault account"
              : "Sign in to access your cash inflow, outflow & loans"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. John Doe"
                  className="w-full bg-surface border border-border-muted rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                placeholder="name@example.com"
                className="w-full bg-surface border border-border-muted rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full bg-surface border border-border-muted rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-black bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 mt-2"
          >
            <span>
              {loading
                ? "Processing..."
                : isRegister
                  ? "Create Vault Account"
                  : "Sign In to Vault"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 pt-5 border-t border-border-subtle text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            {isRegister ? (
              <>
                Already have an account?{" "}
                <span className="text-primary font-semibold">Sign In</span>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <span className="text-primary font-semibold">Register</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Secured with Passport-JWT & PostgreSQL</span>
        </div>
      </motion.div>
    </div>
  );
}
