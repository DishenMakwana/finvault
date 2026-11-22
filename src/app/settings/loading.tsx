import React from "react";
import { PremiumLoading } from "@/components/ui/premium-loading";

export default function SettingsLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[calc(100vh-10rem)] my-auto">
      <PremiumLoading
        theme="rose"
        size="md"
        title="SETTINGS & SESSIONS"
        subtitle="Loading active sessions & configuration profiles..."
      />
    </div>
  );
}
