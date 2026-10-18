import type { MarketStats } from '@repo/types';
import type { PublicTrade } from '@repo/types/socket';
import { marketStatsQueryKey } from '@/hooks/queries/useMarkets';
import { queryClient } from './query-client';

interface Tick {
    price: number;
    notional: number;
    high: number;
    low: number;
}

let pending = new Map<string, Tick>();
let frame = 0;

function flush(): void {
    frame = 0;
    if (pending.size === 0) return;
    const ticks = pending;
    pending = new Map();

    queryClient.setQueryData<MarketStats[]>(marketStatsQueryKey, (stats) => {
        if (!stats) return stats;
        const seen = new Set<string>();
        const next = stats.map((s) => {
            const tick = ticks.get(s.marketId);
            if (!tick) return s;
            seen.add(s.marketId);
            const open = parseFloat(s.openPrice);
            return {
                ...s,
                lastPrice: String(tick.price),
                change24h: open > 0 ? ((tick.price - open) / open) * 100 : s.change24h,
                volume24h: String(parseFloat(s.volume24h) + tick.notional),
                high24h: String(Math.max(parseFloat(s.high24h), tick.high)),
                low24h: String(Math.min(parseFloat(s.low24h), tick.low)),
            };
        });
        for (const [marketId, tick] of ticks) {
            if (seen.has(marketId)) continue;
            next.push({
                marketId,
                lastPrice: String(tick.price),
                openPrice: String(tick.price),
                change24h: 0,
                volume24h: String(tick.notional),
                high24h: String(tick.high),
                low24h: String(tick.low),
            });
        }
        return next;
    });
}

export function queueTicker(trade: PublicTrade): void {
    const price = parseFloat(trade.price);
    const notional = price * parseFloat(trade.quantity);
    const current = pending.get(trade.market_id);
    pending.set(trade.market_id, {
        price,
        notional: (current?.notional ?? 0) + notional,
        high: Math.max(current?.high ?? price, price),
        low: Math.min(current?.low ?? price, price),
    });
    if (frame === 0) frame = requestAnimationFrame(flush);
}
