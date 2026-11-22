import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserState } from "@/types/settings.types";

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      houses: [],
      activeHouseId: "ALL",
      userHousePreferences: {},
      activeSessionsCount: 1,
      isHydrated: false,

      setUser: (user) => set({ user }),
      setHouses: (houses) => set({ houses }),
      setActiveHouseId: (activeHouseId) => {
        if (typeof document !== "undefined") {
          document.cookie = `finvault_active_house=${activeHouseId}; path=/; max-age=31536000; SameSite=Lax`;
        }
        set((state) => ({
          activeHouseId,
          userHousePreferences: state.user?.id
            ? {
                ...state.userHousePreferences,
                [String(state.user.id)]: String(activeHouseId),
              }
            : state.userHousePreferences,
        }));
      },
      setActiveSessionsCount: (count) =>
        set({ activeSessionsCount: Math.max(0, count) }),
      decrementActiveSessionsCount: () =>
        set((state) => ({
          activeSessionsCount: Math.max(0, state.activeSessionsCount - 1),
        })),
      setUserData: ({ user, houses, activeSessionsCount }) =>
        set((state) => {
          // Auto-select the user's primary/owned house by default
          const userHome =
            houses.find(
              (h) => h.isOwner || (user?.id && h.userId === user.id)
            ) || houses[0];
          const defaultHouseId = userHome ? String(userHome.id) : "ALL";

          // If this user already has a saved preference, verify it exists in their houses
          let resolvedActiveHouseId = defaultHouseId;
          if (user?.id) {
            const savedPref = state.userHousePreferences?.[String(user.id)];
            if (savedPref !== undefined) {
              const isValid =
                savedPref === "ALL" ||
                houses.some((h) => String(h.id) === String(savedPref));
              if (isValid) {
                resolvedActiveHouseId = savedPref;
              }
            }
          }

          if (typeof document !== "undefined") {
            document.cookie = `finvault_active_house=${resolvedActiveHouseId}; path=/; max-age=31536000; SameSite=Lax`;
          }

          return {
            user,
            houses,
            activeHouseId: resolvedActiveHouseId,
            activeSessionsCount:
              activeSessionsCount !== undefined
                ? activeSessionsCount
                : state.activeSessionsCount,
            isHydrated: true,
          };
        }),
      clearUser: () => {
        if (typeof document !== "undefined") {
          document.cookie = "finvault_active_house=; path=/; max-age=0";
        }
        set({
          user: null,
          houses: [],
          activeHouseId: "ALL",
          activeSessionsCount: 0,
          isHydrated: true,
        });
      },
    }),
    {
      name: "finvault-user-state",
      storage: createJSONStorage(() => localStorage),
      // Scoped per-user house preferences in localStorage (prevents cross-user state leaks):
      partialize: (state) => ({
        userHousePreferences: state.userHousePreferences,
      }),
    }
  )
);
