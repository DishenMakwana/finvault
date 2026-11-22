import { PremiumLoading } from "@/components/ui/premium-loading";

export default function HousesLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[calc(100vh-10rem)] my-auto">
      <PremiumLoading
        theme="emerald"
        size="md"
        title="PROPERTIES & ASSETS"
        subtitle="Loading property portfolio & linked transaction records..."
      />
    </div>
  );
}
