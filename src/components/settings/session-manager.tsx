"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Trash2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { revokeSessionAction } from "@/lib/actions/auth.actions";
import { formatDateTime } from "@/lib/formatters";
import { useUserStore } from "@/stores/use-user-store";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { SessionItem, SessionManagerProps } from "@/types/settings.types";

export function SessionManager({ sessions, userEmail }: SessionManagerProps) {
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

  const isMobile = (ua?: string | null) => {
    if (!ua) return false;
    return /mobile|android|iphone|ipad/i.test(ua);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl flex items-center justify-between">
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
          Passport-JWT Active
        </span>
      </div>

      {/* Sessions Grid */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white tracking-tight">
          Connected Devices & Tokens
        </h4>

        <div className="space-y-3">
          {sessions.map((session, index) => {
            const mobile = isMobile(session.userAgent);
            const isFirst = index === 0;

            return (
              <div
                key={session.id}
                className="bg-card border border-border-subtle hover:border-border-hover rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border-muted flex items-center justify-center text-neutral-300">
                    {mobile ? (
                      <Smartphone className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Laptop className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white truncate max-w-sm">
                        {session.userAgent || "Web Browser Session"}
                      </p>
                      {isFirst && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                          Current Device
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                      <span
                        className="flex items-center gap-1"
                        suppressHydrationWarning
                      >
                        <Clock className="w-3 h-3 text-neutral-500" />
                        Signed in: {formatDateTime(session.createdAt)}
                      </span>
                      <span>•</span>
                      <span>IP: {session.ipAddress || "127.0.0.1"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionToRevoke(session)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Session</span>
                  </button>
                </div>
              </div>
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
              {sessionToRevoke?.userAgent || "Unknown Device"}
            </strong>
            ) will be immediately signed out.
          </span>
        }
        confirmLabel="Revoke Session"
      />
    </div>
  );
}
