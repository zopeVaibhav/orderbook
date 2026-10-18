import { create } from 'zustand';
import type { Side } from '@/types/order';

export type OrderEntryFill = {
    side: Side;
    price: string;
    quantity?: string;
};

interface OrderEntryState {
    fill: OrderEntryFill | null;
    sideRequest: Side | null;
    sheetOpen: boolean;
    requestFill: (fill: OrderEntryFill) => void;
    clearFill: () => void;
    openSheet: (side?: Side) => void;
    closeSheet: () => void;
    clearSideRequest: () => void;
}

export const useOrderEntryStore = create<OrderEntryState>((set) => ({
    fill: null,
    sideRequest: null,
    sheetOpen: false,
    requestFill: (fill) => set({ fill: { ...fill }, sheetOpen: true }),
    clearFill: () => set({ fill: null }),
    openSheet: (side) => set({ sheetOpen: true, sideRequest: side ?? null }),
    closeSheet: () => set({ sheetOpen: false }),
    clearSideRequest: () => set({ sideRequest: null }),
}));
