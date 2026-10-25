import type { Candle } from '@/store/candles';

export interface Viewport {
    visible: Candle[];
    start: number;
    slot: number;
    min: number;
    max: number;
    y: (price: number) => number;
    x: (index: number) => number;
}

export function visibleCount(width: number, slot: number): number {
    return Math.max(2, Math.floor(width / slot));
}

export function clampOffset(offset: number, total: number, count: number): number {
    return Math.max(0, Math.min(offset, Math.max(0, total - count)));
}

export function viewport(
    candles: Candle[],
    width: number,
    height: number,
    slot: number,
    endOffset: number,
    padY: number,
    reference: number | null,
): Viewport {
    const count = visibleCount(width, slot);
    const offset = clampOffset(endOffset, candles.length, count);
    const end = candles.length - offset;
    const start = Math.max(0, end - count);
    const visible = candles.slice(start, end);

    let min = Infinity;
    let max = -Infinity;
    for (const c of visible) {
        if (c.low < min) min = c.low;
        if (c.high > max) max = c.high;
    }
    if (reference !== null && offset === 0) {
        min = Math.min(min, reference);
        max = Math.max(max, reference);
    }
    if (!Number.isFinite(min)) {
        min = 0;
        max = 1;
    }
    if (max === min) {
        const pad = max === 0 ? 1 : Math.abs(max) * 0.001;
        min -= pad;
        max += pad;
    }

    const span = max - min;
    const inner = height - padY * 2;
    const rightEdge = width - slot / 2;

    return {
        visible,
        start,
        slot,
        min,
        max,
        y: (price) => padY + (1 - (price - min) / span) * inner,
        x: (index) => rightEdge - (visible.length - 1 - index) * slot,
    };
}

function niceStep(raw: number): number {
    const exponent = Math.floor(Math.log10(raw));
    const base = 10 ** exponent;
    const fraction = raw / base;
    const nice =
        fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
    return nice * base;
}

export function priceTicks(min: number, max: number, target = 5): number[] {
    const step = niceStep((max - min) / target);
    const ticks: number[] = [];
    for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
    return ticks;
}

export function formatAxisTime(time: number, intervalMs: number): string {
    const d = new Date(time);
    if (intervalMs >= 86_400_000) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (intervalMs < 60_000) return `${hh}:${mm}:${String(d.getSeconds()).padStart(2, '0')}`;
    return `${hh}:${mm}`;
}

export function indexAt(px: number, plotWidth: number, slot: number, length: number): number {
    const fromRight = Math.round((plotWidth - slot / 2 - px) / slot);
    return Math.max(0, Math.min(length - 1, length - 1 - fromRight));
}
