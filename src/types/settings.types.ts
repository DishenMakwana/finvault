export interface SessionItem {
  id: number | string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  expiresAt: Date | string;
  token: string;
}

export interface SessionManagerProps {
  sessions: SessionItem[];
  userEmail: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  sessionId: number;
  iat?: number;
  exp?: number;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string | null;
}

export interface HouseOption {
  id: number | string;
  name: string;
  initialCash?: any;
  userId?: number;
  isOwner?: boolean;
}

export interface UserState {
  user: UserProfile | null;
  houses: HouseOption[];
  activeHouseId: number | string;
  userHousePreferences: Record<string, string>;
  activeSessionsCount: number;
  isHydrated: boolean;

  setUser: (user: UserProfile | null) => void;
  setHouses: (houses: HouseOption[]) => void;
  setActiveHouseId: (activeHouseId: number | string) => void;
  setActiveSessionsCount: (count: number) => void;
  decrementActiveSessionsCount: () => void;
  setUserData: (data: {
    user: UserProfile | null;
    houses: HouseOption[];
    activeSessionsCount?: number;
  }) => void;
  clearUser: () => void;
}

export interface CacheItem<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}
