import { create } from 'zustand';
import type { Side } from '@/types/order';

export type OrderEntryFill = {
    side: Side;
    price: string;
    quantity?: string;
};

interface OrderEntryState {
    fill: OrderEntryFill | null;
    requestFill: (fill: OrderEntryFill) => void;
    clearFill: () => void;
}

export const useOrderEntryStore = create<OrderEntryState>((set) => ({
    fill: null,
    requestFill: (fill) => set({ fill: { ...fill } }),
    clearFill: () => set({ fill: null }),
}));
