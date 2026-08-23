import { scale, unscale } from '@repo/money';
import type { Market } from '@/types/market';

export { stepFor } from '@repo/money';

/** Market minimum in human units, for the hint under the quantity field. */
export function minQuantityOf(market: Market): string {
    return unscale(market.minQuantity, market.lotExp);
}

/**
 * Same rules the server enforces, checked before the request so a typo costs a
 * render instead of a round trip.
 */
export function validateQuantity(market: Market, value: string): string | null {
    const scaled = scale(value, market.lotExp);
    if (scaled === null) return `Quantity accepts at most ${market.lotExp} decimals`;
    if (scaled <= 0n) return 'Quantity must be greater than zero';
    if (scaled < BigInt(market.minQuantity)) {
        return `Minimum quantity is ${minQuantityOf(market)} ${market.symbol}`;
    }
    return null;
}

export function validatePrice(market: Market, value: string): string | null {
    const scaled = scale(value, market.tickExp);
    if (scaled === null) return `Price accepts at most ${market.tickExp} decimals`;
    if (scaled <= 0n) return 'Price must be greater than zero';
    return null;
}
