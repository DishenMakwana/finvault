import React from "react";
import { PremiumLoading } from "@/components/ui/premium-loading";

export default function AnalyticsLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[calc(100vh-10rem)] my-auto">
      <PremiumLoading
        theme="blue"
        size="md"
        title="ANALYTICS ENGINE"
        subtitle="Aggregating multi-property cashflow, benchmarks & rental matrix..."
      />
    </div>
  );
}
