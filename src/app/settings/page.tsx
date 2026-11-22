import { requireAuth, getActiveSessions } from "@/lib/auth";
import { SessionManager } from "@/components/settings/session-manager";

export default async function SettingsPage() {
  const user = await requireAuth();
  const sessions = await getActiveSessions(user.id);

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

      <SessionManager sessions={sessions} userEmail={user.email} />
    </div>
  );
}
