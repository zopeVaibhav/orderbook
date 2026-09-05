import { Side } from '@repo/database';
import { QUOTE } from '../config/bots.config';

const BPS = 10_000;

export type MarketSpec = {
    id: string;
    base: string;
    quote: string;
    tickExp: number;
    lotExp: number;
    minQuantity: bigint;
};

export type Quote = {
    side: Side;
    level: number;
    priceTicks: bigint;
    qtyLots: bigint;
};

export function ticksFor(price: number, tickExp: number): bigint {
    return BigInt(Math.max(1, Math.round(price * 10 ** tickExp)));
}

export function priceOf(priceTicks: bigint, tickExp: number): number {
    return Number(priceTicks) / 10 ** tickExp;
}

function stepTicks(midTicks: bigint, bps: number): bigint {
    const raw = Math.round((Number(midTicks) * bps) / BPS);
    return BigInt(Math.max(1, raw));
}

function lotsFor(notional: number, price: number, market: MarketSpec): bigint {
    const units = notional / price;
    const lots = BigInt(Math.round(units * 10 ** market.lotExp));

    return lots < market.minQuantity ? market.minQuantity : lots;
}

export function levelStep(mid: number, tickExp: number): bigint {
    return stepTicks(ticksFor(mid, tickExp), QUOTE.LEVEL_STEP_BPS);
}

export function buildLadder(market: MarketSpec, mid: number): Quote[] {
    const midTicks = ticksFor(mid, market.tickExp);
    const half = stepTicks(midTicks, QUOTE.SPREAD_BPS);
    const step = stepTicks(midTicks, QUOTE.LEVEL_STEP_BPS);

    const quotes: Quote[] = [];

    for (let level = 0; level < QUOTE.LEVELS; level++) {
        const offset = half + step * BigInt(level);
        const notional = QUOTE.BASE_NOTIONAL * QUOTE.SIZE_GROWTH ** level;

        const bidTicks = midTicks - offset;
        if (bidTicks > 0n) {
            quotes.push({
                side: Side.BID,
                level,
                priceTicks: bidTicks,
                qtyLots: lotsFor(notional, priceOf(bidTicks, market.tickExp), market),
            });
        }

        const askTicks = midTicks + offset;
        quotes.push({
            side: Side.ASK,
            level,
            priceTicks: askTicks,
            qtyLots: lotsFor(notional, priceOf(askTicks, market.tickExp), market),
        });
    }

    return quotes;
}
