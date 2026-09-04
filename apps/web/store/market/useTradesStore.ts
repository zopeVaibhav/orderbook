import { create } from 'zustand';
import type { Side } from '@repo/types/kafka';
import type { PublicTrade } from '@repo/types/socket';

export type MarketTrade = {
    id: number;
    price: number;
    quantity: number;
    side: Side;
    ts: number;
};

const MAX_TRADES = 60;

function toMarketTrade(trade: PublicTrade): MarketTrade {
    return {
        id: trade.trade_id,
        price: parseFloat(trade.price),
        quantity: parseFloat(trade.quantity),
        side: trade.taker_side,
        ts: trade.ts,
    };
}

interface TradesState {
    trades: MarketTrade[];
    addTrade: (trade: PublicTrade) => void;
    seed: (trades: PublicTrade[]) => void;
    reset: () => void;
}

export const useTradesStore = create<TradesState>((set) => ({
    trades: [],

    seed: (fetched) =>
        set((s) => {
            const oldestKnown = s.trades[s.trades.length - 1]?.ts;
            const older = (
                oldestKnown === undefined ? fetched : fetched.filter((t) => t.ts < oldestKnown)
            )
                .map(toMarketTrade)
                .reverse();
            const trades = [...s.trades, ...older];
            return { trades: trades.length > MAX_TRADES ? trades.slice(0, MAX_TRADES) : trades };
        }),

    addTrade: (trade) =>
        set((s) => {
            const next = toMarketTrade(trade);
            const trades = [next, ...s.trades];
            return {
                trades: trades.length > MAX_TRADES ? trades.slice(0, MAX_TRADES) : trades,
            };
        }),

    reset: () => set({ trades: [] }),
}));
