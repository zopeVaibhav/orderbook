export function formatPrice(n: number): string {
    if (n >= 100)
        return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(4);
    return n.toFixed(6);
}

export function formatDelta(delta: number, reference: number): string {
    const digits = reference >= 100 ? 2 : reference >= 1 ? 4 : 6;
    const sign = delta >= 0 ? '+' : '-';
    return `${sign}${Math.abs(delta).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function formatUsd(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCompact(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
    return n.toFixed(2);
}

export function formatSize(n: number): string {
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(3);
    return n.toFixed(4);
}

export function formatChange(pct: number): string {
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

export function formatRelative(ts: number, now: number = Date.now()): string {
    const seconds = Math.max(0, Math.round((now - ts) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatClock(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

export function firstName(name: string | undefined): string {
    return name?.trim().split(/\s+/)[0] ?? '';
}

export function formatDay(ts: number): string {
    const d = new Date(ts);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return `${String(d.getDate()).padStart(2, '0')} ${month} '${String(d.getFullYear()).slice(-2)}`;
}

export function formatDayTime(ts: number): string {
    const time = new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${formatDay(ts)}, ${time}`;
}

export function formatDayHeading(ts: number, now: number = Date.now()): string {
    const day = new Date(ts).toDateString();
    if (day === new Date(now).toDateString()) return 'Today';
    if (day === new Date(now - 86_400_000).toDateString()) return 'Yesterday';
    return formatDay(ts);
}
