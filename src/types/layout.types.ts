import React from "react";
import type { UserProfile, HouseOption } from "@/types/settings.types";

export interface HeaderProps {
  houses?: { id: number | string; name: string }[];
  activeSessionsCount?: number;
  currentHouseId?: string | number;
  inflowCategories?: string[];
  outflowCategories?: string[];
}

export interface SidebarProps {
  userEmail?: string;
  userName?: string | null;
}

export interface UserStoreProviderProps {
  user: UserProfile | null;
  houses: HouseOption[];
  activeSessionsCount: number;
  children: React.ReactNode;
}
