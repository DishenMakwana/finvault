"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Tablet,
  Trash2,
  Clock,
  Globe,
  Cpu,
} from "lucide-react";
import { revokeSessionAction } from "@/lib/actions/auth.actions";
import { formatDateTime } from "@/lib/formatters";
import { useUserStore } from "@/stores/use-user-store";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { SessionItem, SessionManagerProps } from "@/types/settings.types";

function getDeviceIcon(session: SessionItem) {
  const type = (session.deviceType || "").toLowerCase();
  const ua = (session.userAgent || "").toLowerCase();

  if (type === "mobile" || /iphone|android.*mobile/i.test(ua)) {
    return <Smartphone className="w-5 h-5 text-indigo-400" />;
  }
  if (type === "tablet" || /ipad|tablet/i.test(ua)) {
    return <Tablet className="w-5 h-5 text-purple-400" />;
  }
  return <Laptop className="w-5 h-5 text-teal-400" />;
}

function getDeviceDisplay(session: SessionItem) {
  const os = session.osName
    ? `${session.osName}${session.osVersion ? ` ${session.osVersion}` : ""}`
    : null;
  const vendor = session.deviceVendor || "";
  const model = session.deviceModel || "";
  const hardware = [vendor, model].filter(Boolean).join(" ");

  const browser = session.browserName
    ? `${session.browserName}${
        session.browserVersion ? ` ${session.browserVersion.split(".")[0]}` : ""
      }`
    : null;

  let title = "Personal Device";
  if (hardware && os) {
    title = `${hardware} • ${os}`;
  } else if (os) {
    title = `${os} Device`;
  } else if (hardware) {
    title = hardware;
  } else if (session.userAgent) {
    if (/mac/i.test(session.userAgent)) title = "Apple Mac";
    else if (/windows/i.test(session.userAgent)) title = "Windows PC";
    else if (/iphone/i.test(session.userAgent)) title = "Apple iPhone";
    else if (/android/i.test(session.userAgent)) title = "Android Device";
  }

  const formFactor =
    session.deviceType ||
    (/mobile|iphone|android/i.test(session.userAgent || "")
      ? "Mobile"
      : "Desktop");

  return {
    title,
    browser: browser || "Web Browser",
    formFactor: formFactor.charAt(0).toUpperCase() + formFactor.slice(1),
  };
}

export function SessionManager({
  sessions,
  userEmail,
  currentSessionId,
}: SessionManagerProps) {
  const [sessionToRevoke, setSessionToRevoke] = useState<SessionItem | null>(
    null
  );
  const [isRevoking, setIsRevoking] = useState(false);
  const decrementActiveSessionsCount = useUserStore(
    (s) => s.decrementActiveSessionsCount
  );

  const handleConfirmRevoke = async () => {
    if (!sessionToRevoke) return;
    setIsRevoking(true);
    const res = await revokeSessionAction(sessionToRevoke.id);
    if (res?.success) {
      decrementActiveSessionsCount();
    }
    setIsRevoking(false);
    setSessionToRevoke(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Active JWT Sessions Guard
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Signed in as{" "}
              <span className="text-white font-medium">{userEmail}</span> •{" "}
              {sessions.length} active database session
              {sessions.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          JWT Guard Active
        </span>
      </motion.div>

      {/* Sessions Grid */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white tracking-tight">
          Connected Devices & Active Tokens
        </h4>

        <div className="space-y-3">
          {sessions.map((session, index) => {
            const isCurrent = currentSessionId
              ? Number(session.id) === Number(currentSessionId)
              : index === 0;
            const { title, browser, formFactor } = getDeviceDisplay(session);

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.08 + index * 0.04,
                  ease: "easeOut",
                }}
                whileHover={{ scale: 1.005 }}
                className="bg-card border border-border-subtle hover:border-border-hover rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-surface border border-border-muted flex items-center justify-center shrink-0">
                    {getDeviceIcon(session)}
                  </div>

                  <div className="min-w-0">
                    {/* Device Title & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-white truncate">
                        {title}
                      </p>

                      {/* Browser Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-teal-300 border border-slate-700/80">
                        {browser}
                      </span>

                      {/* Form Factor Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                        {formFactor}
                      </span>

                      {/* Architecture Badge (if available) */}
                      {session.cpuArchitecture && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-800/80 text-neutral-400 border border-neutral-700/40 flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5" />
                          {session.cpuArchitecture}
                        </span>
                      )}

                      {/* Current Device Badge */}
                      {isCurrent && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          This Device (Active Now)
                        </span>
                      )}
                    </div>

                    {/* Metadata Row: IP & Timestamp */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 mt-1.5">
                      <span
                        className="flex items-center gap-1"
                        suppressHydrationWarning
                      >
                        <Clock className="w-3 h-3 text-neutral-500" />
                        Signed in: {formatDateTime(session.createdAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-neutral-500" />
                        IP: {session.ipAddress || "127.0.0.1"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revoke Action (Only for other devices) */}
                <div className="flex items-center gap-3 shrink-0">
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => setSessionToRevoke(session)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke Session</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Confirm Revoke Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={handleConfirmRevoke}
        loading={isRevoking}
        title="Revoke Active Session?"
        description={
          <span>
            Are you sure you want to revoke this session? The device (
            <strong className="text-white font-semibold">
              {sessionToRevoke
                ? getDeviceDisplay(sessionToRevoke).title
                : "Unknown Device"}
            </strong>
            ) will be immediately signed out.
          </span>
        }
        confirmLabel="Revoke Session"
      />
    </div>
  );
}
