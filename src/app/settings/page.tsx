import { requireAuth, getCurrentSessionId } from "@/lib/auth";
import { getUserActiveSessions } from "@/lib/actions/auth.actions";
import { SessionManager } from "@/components/settings/session-manager";

export default async function SettingsPage() {
  const [user, currentSessionId, sessions] = await Promise.all([
    requireAuth(),
    getCurrentSessionId(),
    getUserActiveSessions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Active Sessions & Security
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          View all active JWT sessions stored in PostgreSQL and revoke access
          from unused devices.
        </p>
      </div>

      <SessionManager
        sessions={sessions}
        userEmail={user.email}
        currentSessionId={currentSessionId}
      />
    </div>
  );
}
