import { create } from 'zustand';
import type { Side, TradeOut } from '@repo/types/kafka';

export type MarketTrade = {
    id: number;
    price: number;
    quantity: number;
    side: Side;
    ts: number;
};

const MAX_TRADES = 60;

interface TradesState {
    trades: MarketTrade[];
    addTrade: (trade: TradeOut) => void;
    reset: () => void;
}

export const useTradesStore = create<TradesState>((set) => ({
    trades: [],

    addTrade: (trade) =>
        set((s) => {
            const next: MarketTrade = {
                id: trade.trade_id,
                price: parseFloat(trade.price),
                quantity: parseFloat(trade.quantity),
                side: trade.taker_side,
                ts: trade.ts,
            };
            const trades = [next, ...s.trades];
            return {
                trades: trades.length > MAX_TRADES ? trades.slice(0, MAX_TRADES) : trades,
            };
        }),

    reset: () => set({ trades: [] }),
}));
