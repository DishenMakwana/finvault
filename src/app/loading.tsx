import React from "react";
import { PremiumLoading } from "@/components/ui/premium-loading";

export default function RootLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[calc(100vh-10rem)] my-auto">
      <PremiumLoading
        theme="teal"
        size="md"
        title="FINVAULT DASHBOARD"
        subtitle="Synchronizing cash flow intelligence & recent feeds..."
      />
    </div>
  );
}
