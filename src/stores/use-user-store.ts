import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserState } from "@/types/settings.types";

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      houses: [],
      activeHouseId: "ALL",
      activeSessionsCount: 1,
      isHydrated: false,

      setUser: (user) => set({ user }),
      setHouses: (houses) => set({ houses }),
      setActiveHouseId: (activeHouseId) => set({ activeHouseId }),
      setActiveSessionsCount: (count) =>
        set({ activeSessionsCount: Math.max(0, count) }),
      decrementActiveSessionsCount: () =>
        set((state) => ({
          activeSessionsCount: Math.max(0, state.activeSessionsCount - 1),
        })),
      setUserData: ({ user, houses, activeSessionsCount }) =>
        set((state) => ({
          user,
          houses,
          activeSessionsCount:
            activeSessionsCount !== undefined
              ? activeSessionsCount
              : state.activeSessionsCount,
          isHydrated: true,
        })),
      clearUser: () =>
        set({
          user: null,
          houses: [],
          activeHouseId: "ALL",
          activeSessionsCount: 0,
          isHydrated: true,
        }),
    }),
    {
      name: "finvault-user-state",
      storage: createJSONStorage(() => localStorage),
      // Only persist user-chosen active house preference in localStorage:
      partialize: (state) => ({
        activeHouseId: state.activeHouseId,
      }),
    }
  )
);
