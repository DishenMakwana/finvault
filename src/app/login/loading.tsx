import { PremiumLoading } from "@/components/ui/premium-loading";

export default function LoginLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center">
      <PremiumLoading
        theme="indigo"
        size="md"
        title="AUTHENTICATING"
        subtitle="Verifying credentials & session security..."
      />
    </div>
  );
}
