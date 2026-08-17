export function formatPrice(n: number): string {
    if (n >= 100)
        return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(4);
    return n.toFixed(6);
}

export function formatCompactPrice(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 10_000 ? 1 : 2)}K`;
    return `$${n.toFixed(2)}`;
}

export function formatUsd(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatSize(n: number): string {
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(3);
    return n.toFixed(4);
}

export function formatChange(pct: number): string {
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

export function formatTime(ts: number): string {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}
