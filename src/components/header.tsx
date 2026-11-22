"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  ArrowLeftRight,
  HandCoins,
  ShieldCheck,
} from "lucide-react";
import { useUserStore } from "@/stores/use-user-store";
import { CustomSelect } from "@/components/ui/custom-select";
import { HeaderProps } from "@/types/layout.types";

export function Header({
  houses,
  activeSessionsCount,
  currentHouseId,
  inflowCategories,
  outflowCategories,
}: HeaderProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const storeHouses = useUserStore((s) => s.houses);
  const storeSessionsCount = useUserStore((s) => s.activeSessionsCount);
  const storeActiveHouseId = useUserStore((s) => s.activeHouseId);
  const setActiveHouseId = useUserStore((s) => s.setActiveHouseId);

  const effectiveHouses = houses && houses.length > 0 ? houses : storeHouses;
  const effectiveSessionsCount =
    activeSessionsCount !== undefined
      ? activeSessionsCount
      : storeSessionsCount;
  const urlHouseId = searchParams.get("houseId");
  const selectedHouseId =
    urlHouseId ||
    (currentHouseId !== undefined ? currentHouseId : storeActiveHouseId);

  const getPageInfo = () => {
    if (pathname.startsWith("/transactions")) {
      return { title: "Transactions", icon: ArrowLeftRight };
    }
    if (pathname.startsWith("/loans")) {
      return { title: "Relative Loans", icon: HandCoins };
    }
    if (pathname.startsWith("/houses")) {
      return { title: "Houses & Cash", icon: Home };
    }
    if (pathname.startsWith("/settings")) {
      return { title: "Active Sessions", icon: ShieldCheck };
    }
    return { title: "Overview", icon: LayoutDashboard };
  };

  const { title: pageTitle, icon: PageIcon } = getPageInfo();

  return (
    <>
      <header className="h-16 bg-sidebar border-b border-border-active flex items-center justify-between px-6 sticky top-0 z-30">
        {/* Active Page Logo & Title (matches selected sidebar page) */}
        <div className="flex items-center gap-2.5">
          <PageIcon className="w-5 h-5 text-primary stroke-[2.25] flex-shrink-0" />
          <h1 className="text-base font-bold tracking-tight text-white leading-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Right Actions Toolbar */}
        <div className="flex items-center gap-3">
          {/* House Selector */}
          <div className="w-44">
            <CustomSelect
              value={String(selectedHouseId)}
              onChange={(val) => {
                setActiveHouseId(val);
                const params = new URLSearchParams(searchParams.toString());
                if (val === "ALL") {
                  params.delete("houseId");
                } else {
                  params.set("houseId", val);
                }
                router.push(`${pathname}?${params.toString()}`);
              }}
              icon={Home}
              buttonClassName="bg-card hover:bg-surface-hover border-border-muted py-1.5 px-3 text-xs"
              options={[
                { value: "ALL", label: "All Houses" },
                ...effectiveHouses.map((h) => ({
                  value: String(h.id),
                  label: h.name,
                })),
              ]}
            />
          </div>

          {/* Active Sessions Badge */}
          <Link
            href="/settings"
            className="flex items-center gap-1.5 bg-card hover:bg-surface-hover border border-border-muted rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>
              {effectiveSessionsCount}{" "}
              {effectiveSessionsCount === 1 ? "Session" : "Sessions"} Active
            </span>
          </Link>
        </div>
      </header>
    </>
  );
}
