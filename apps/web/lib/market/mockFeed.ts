import { MAX_CANDLES, type Candle } from '@/types/candles';
import type { BookDeltaEntry, BookSnapshotPayload, EngineEvent } from '@repo/types/kafka';

export const MOCK_MARKET_ID = 'BTC/USDC';
export const TICK_MS = 250;

const LEVELS = 30;
const TICK = 0.1;
const CENTER_START = 64328.2;
const MAX_DRIFT = 0.15;

function priceKey(p: number): string {
    return p.toFixed(1);
}

function qty(): string {
    const r = Math.random();
    if (r < 0.08) return (0.2 + Math.random() * 0.1).toFixed(5);
    if (r < 0.25) return (0.05 + Math.random() * 0.15).toFixed(5);
    if (r < 0.65) return (0.005 + Math.random() * 0.02).toFixed(5);
    return (0.00005 + Math.random() * 0.005).toFixed(5);
}

function buildSide(mid: number, direction: 1 | -1): Map<string, string> {
    const side = new Map<string, string>();
    for (let i = 1; i <= LEVELS; i++) {
        side.set(priceKey(mid + direction * i * TICK), qty());
    }
    return side;
}

function diffSide(
    prev: Map<string, string>,
    next: Map<string, string>,
    side: 'ASK' | 'BID',
): BookDeltaEntry[] {
    const changes: BookDeltaEntry[] = [];
    for (const [price, quantity] of next) {
        if (prev.get(price) !== quantity) changes.push({ side, price, new_quantity: quantity });
    }
    for (const price of prev.keys()) {
        if (!next.has(price)) changes.push({ side, price, new_quantity: '0' });
    }
    return changes;
}

type Listener = (event: EngineEvent) => void;

class MockFeed {
    private mid = CENTER_START;
    private asks = new Map<string, string>();
    private bids = new Map<string, string>();
    private seq = 0;
    private tradeId = 0;
    private timer: ReturnType<typeof setInterval> | null = null;
    private listener: Listener | null = null;

    snapshot(): BookSnapshotPayload {
        this.mid = CENTER_START;
        this.asks = buildSide(this.mid, 1);
        this.bids = buildSide(this.mid, -1);
        this.seq = 1;
        return {
            market_id: MOCK_MARKET_ID,
            asks: [...this.asks.entries()],
            bids: [...this.bids.entries()],
            seq: this.seq,
        };
    }

    start(listener: Listener): void {
        this.stop();
        this.listener = listener;
        this.timer = setInterval(() => this.tick(), TICK_MS);
    }

    stop(): void {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.listener = null;
    }

    private tick(): void {
        const emit = this.listener;
        if (!emit) return;

        const drift = (Math.random() - 0.5) * MAX_DRIFT * 2;
        this.mid = +(this.mid + drift).toFixed(1);

        const nextAsks = buildSide(this.mid, 1);
        const nextBids = buildSide(this.mid, -1);
        const changes = [
            ...diffSide(this.asks, nextAsks, 'ASK'),
            ...diffSide(this.bids, nextBids, 'BID'),
        ];
        this.asks = nextAsks;
        this.bids = nextBids;

        this.seq += 1;
        const ts = Date.now();

        if (changes.length > 0) {
            emit({ type: 'book_delta', market_id: MOCK_MARKET_ID, changes, ts, seq: this.seq });
        }

        if (Math.random() < 0.7) {
            const takerBuys = drift >= 0;
            this.tradeId += 1;
            emit({
                type: 'trade',
                market_id: MOCK_MARKET_ID,
                trade_id: this.tradeId,
                price: priceKey(this.mid),
                quantity: qty(),
                maker_user_id: 'mock-maker',
                maker_client_order_id: `m-${this.tradeId}`,
                taker_user_id: 'mock-taker',
                taker_client_order_id: `t-${this.tradeId}`,
                taker_side: takerBuys ? 'BID' : 'ASK',
                ts,
                seq: this.seq,
            });
        }
    }
}

export const mockFeed = new MockFeed();

function seededRng(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

export function seedCandleHistory(
    nowMs: number,
    candleMs: number,
    anchorPrice: number = CENTER_START,
): Candle[] {
    const rng = seededRng(7);
    const ticksPerCandle = Math.max(1, Math.round(candleMs / TICK_MS));
    const endBucket = (Math.floor(nowMs / candleMs) * candleMs) / 1000;
    const stepSec = candleMs / 1000;

    const walk: Omit<Candle, 'time'>[] = [];
    let price = anchorPrice;

    for (let i = 0; i < MAX_CANDLES; i++) {
        const open = price;
        let high = open;
        let low = open;
        let volume = 0;
        for (let t = 0; t < ticksPerCandle; t++) {
            price += (rng() - 0.5) * MAX_DRIFT * 2;
            high = Math.max(high, price);
            low = Math.min(low, price);
            volume += rng() * 0.05;
        }
        walk.push({ open, high, low, close: price, volume });
    }

    const shift = CENTER_START - walk[walk.length - 1]!.close;
    const round1 = (n: number) => Math.round((n + shift) * 10) / 10;

    return walk.map((c, i) => ({
        time: endBucket - (MAX_CANDLES - 1 - i) * stepSec,
        open: round1(c.open),
        high: round1(c.high),
        low: round1(c.low),
        close: round1(c.close),
        volume: +c.volume.toFixed(5),
    }));
}
