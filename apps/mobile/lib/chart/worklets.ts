export interface ChartCandle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Frame {
    first: number;
    last: number;
    endF: number;
    min: number;
    max: number;
}

export function computeFrame(
    candles: ChartCandle[],
    plotW: number,
    slot: number,
    offset: number,
    reference: number,
): Frame {
    'worklet';
    const len = candles.length;
    const endF = len - offset;
    const count = plotW / slot;
    const first = Math.max(0, Math.floor(endF - count) - 1);
    const last = Math.min(len - 1, Math.ceil(endF));
    let min = Infinity;
    let max = -Infinity;
    for (let i = first; i <= last; i++) {
        const c = candles[i];
        if (!c) continue;
        if (c.low < min) min = c.low;
        if (c.high > max) max = c.high;
    }
    if (reference > 0 && offset < 1) {
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
    return { first, last, endF, min: min - span * 0.06, max: max + span * 0.06 };
}

export function xAt(index: number, endF: number, plotW: number, slot: number): number {
    'worklet';
    return plotW - slot / 2 - (endF - 1 - index) * slot;
}

export function yAt(price: number, frame: Frame, top: number, plotH: number): number {
    'worklet';
    return top + (1 - (price - frame.min) / (frame.max - frame.min)) * (plotH - top * 2);
}

export function indexAtX(x: number, frame: Frame, plotW: number, slot: number): number {
    'worklet';
    const raw = Math.round(frame.endF - 1 - (plotW - slot / 2 - x) / slot);
    return Math.max(frame.first, Math.min(frame.last, raw));
}

export function maxOffset(len: number, plotW: number, slot: number): number {
    'worklet';
    return Math.max(0, len - (plotW / slot) * 0.5);
}

function niceStep(raw: number): number {
    'worklet';
    const exponent = Math.floor(Math.log10(raw));
    const base = Math.pow(10, exponent);
    const fraction = raw / base;
    const nice =
        fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
    return nice * base;
}

export function priceTicks(min: number, max: number, target: number): number[] {
    'worklet';
    const step = niceStep((max - min) / target);
    const ticks: number[] = [];
    for (let v = Math.ceil(min / step) * step; v <= max && ticks.length < 8; v += step)
        ticks.push(v);
    return ticks;
}

export function formatChartPrice(n: number): string {
    'worklet';
    const digits = n >= 100 ? 2 : n >= 1 ? 4 : 6;
    const fixed = n.toFixed(digits);
    if (n < 1000) return fixed;
    const parts = fixed.split('.');
    const whole = (parts[0] ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts[1] ? `${whole}.${parts[1]}` : whole;
}

function pad2(n: number): string {
    'worklet';
    return n < 10 ? `0${n}` : `${n}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatChartTime(time: number, intervalMs: number): string {
    'worklet';
    const d = new Date(time);
    if (intervalMs >= 86_400_000) return `${d.getDate()} ${MONTHS[d.getMonth()] ?? ''}`;
    const hm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return intervalMs < 60_000 ? `${hm}:${pad2(d.getSeconds())}` : hm;
}
