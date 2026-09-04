import { useCandlesStore } from '@/store/market/useCandlesStore';
import type { Timeframe } from '@/types/candles';

export function changeTimeframe(timeframe: Timeframe): void {
    useCandlesStore.getState().setTimeframe(timeframe);
}
