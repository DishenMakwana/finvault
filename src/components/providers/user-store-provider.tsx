"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/use-user-store";
import { UserStoreProviderProps } from "@/types/layout.types";

export function UserStoreProvider({
  user,
  houses,
  activeSessionsCount,
  children,
}: UserStoreProviderProps) {
  // Initialize store on first render
  useState(() => {
    useUserStore.setState({
      user,
      houses,
      activeSessionsCount,
      isHydrated: true,
    });
  });

  // Keep store in sync when Server Component props re-evaluate (e.g. after router.refresh() or Server Actions)
  useEffect(() => {
    useUserStore.getState().setUserData({
      user,
      houses,
      activeSessionsCount,
    });
  }, [user, houses, activeSessionsCount]);

  return <>{children}</>;
}
