import { scale, stepFor, unscale } from '@repo/money';
import type { Market } from '@/hooks/queries/useMarkets';

export { stepFor };

export function minQuantityOf(market: Market): string {
    return unscale(market.minQuantity, market.lotExp);
}

export function validateQuantity(market: Market, value: string): string | null {
    if (!value.trim()) return 'Enter a quantity';
    const scaled = scale(value, market.lotExp);
    if (scaled === null) return `Quantity takes at most ${market.lotExp} decimals`;
    if (scaled <= 0n) return 'Quantity must be above zero';
    if (scaled < BigInt(market.minQuantity)) {
        return `Minimum is ${minQuantityOf(market)} ${market.base}`;
    }
    return null;
}

export function validatePrice(market: Market, value: string): string | null {
    if (!value.trim()) return 'Enter a price';
    const scaled = scale(value, market.tickExp);
    if (scaled === null) return `Price takes at most ${market.tickExp} decimals`;
    if (scaled <= 0n) return 'Price must be above zero';
    return null;
}

export function step(value: string, exp: number, direction: 1 | -1): string {
    const scaled = scale(value.trim() || '0', exp) ?? 0n;
    const next = scaled + BigInt(direction);
    return unscale(next < 0n ? 0n : next, exp);
}

export function floorTo(value: number, exp: number): string {
    if (!Number.isFinite(value) || value <= 0) return '';
    const factor = 10 ** exp;
    const floored = Math.floor(value * factor + 1e-9) / factor;
    return floored > 0 ? floored.toFixed(exp).replace(/\.?0+$/, '') : '';
}

export function snapPrice(value: number, exp: number): string {
    if (!Number.isFinite(value) || value <= 0) return '';
    return value.toFixed(exp).replace(/\.?0+$/, '');
}

export function newClientOrderId(): string {
    const random = Math.floor(Math.random() * 0xffffffff).toString(36);
    return `m-${Date.now().toString(36)}-${random}`;
}
