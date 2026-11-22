"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  ArrowLeftRight,
  LineChart,
  HandCoins,
  ShieldCheck,
  LogOut,
  Coins,
} from "lucide-react";
import { logoutUser } from "@/lib/actions/auth.actions";
import { useUserStore } from "@/stores/use-user-store";
import { SidebarProps } from "@/types/layout.types";

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeUser = useUserStore((s) => s.user);
  const storeActiveHouseId = useUserStore((s) => s.activeHouseId);

  const displayName = storeUser?.name || userName || "Family Manager";
  const displayEmail = storeUser?.email || userEmail || "user@finvault.local";

  const activeHouseId = searchParams.get("houseId") || storeActiveHouseId;

  const getHref = (baseHref: string) => {
    if (baseHref === "/settings") return baseHref;
    if (activeHouseId) {
      return `${baseHref}?houseId=${encodeURIComponent(String(activeHouseId))}`;
    }
    return baseHref;
  };

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Houses & Cash", href: "/houses", icon: Home },
    { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { name: "Analytics", href: "/analytics", icon: LineChart },
    { name: "Relative Loans", href: "/loans", icon: HandCoins },
    { name: "Active Sessions", href: "/settings", icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-border-active flex flex-col justify-between h-screen fixed left-0 top-0 z-40 select-none">
      {/* Top Branding */}
      <div>
        <div className="p-5 flex items-center gap-3 border-b border-border-active">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black font-bold shadow-md shadow-primary/20">
            <Coins className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              FinVault
            </h1>
            <p className="text-[11px] text-neutral-400 font-medium leading-tight">
              Cash Management
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={getHref(item.href)}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-primary-tint text-primary border border-primary shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-surface-hover border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-primary" : "text-neutral-400"}`}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Section & Logout */}
      <div className="p-4 border-t border-border-active">
        <div className="bg-card border border-border-subtle rounded-xl p-3 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-white truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-neutral-400 truncate">
              {displayEmail}
            </p>
          </div>
          <form
            action={logoutUser}
            onSubmit={() => useUserStore.getState().clearUser()}
          >
            <button
              type="submit"
              title="Sign Out"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
