export interface HouseItem {
  id: number;
  userId?: number;
  name: string;
  address?: string | null;
  initialCash: number;
  initialCashDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  currentCash?: number;
  totalInflow?: number;
  totalOutflow?: number;
  isOwner?: boolean;
  ownerName?: string | null;
  user?: {
    id: number;
    name?: string | null;
    email: string;
  };
}

export interface HouseListProps {
  houses: HouseItem[];
  totalCurrentCash?: number;
  totalInitialCash?: number;
}

export interface HousesWithBalancesResult {
  houses: HouseItem[];
  totalCurrentCash: number;
  totalInitialCash: number;
}

export interface TargetHouseResolution {
  targetIds: number[];
  isAll: boolean;
  cacheKeySegment: string;
}

export interface HousesPageProps {
  searchParams?: Promise<{ houseId?: string }>;
}
