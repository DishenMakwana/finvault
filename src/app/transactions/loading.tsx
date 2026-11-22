import { PremiumLoading } from "@/components/ui/premium-loading";

export default function TransactionsLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[calc(100vh-10rem)] my-auto">
      <PremiumLoading
        theme="purple"
        size="md"
        title="TRANSACTIONS REGISTRY"
        subtitle="Fetching indexed ledger, active filters & balance summaries..."
      />
    </div>
  );
}
