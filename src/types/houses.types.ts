interface HouseItem {
  id: number | string;
  name: string;
  address?: string | null;
  initialCash: any;
  initialCashDate: Date | string;
  currentCash?: number;
  totalInflow?: number;
  totalOutflow?: number;
  isOwner?: boolean;
  ownerName?: string | null;
}

export interface HouseListProps {
  houses: HouseItem[];
  totalCurrentCash?: number;
  totalInitialCash?: number;
}
