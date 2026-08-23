/**
 * Icons ship with the app, so only symbols with a file here get an image; the
 * rest fall back to a lettered badge.
 */
const ICONS: Record<string, string> = {
    BTC: '/coins/bitcoin.svg',
};

export function marketIcon(symbol: string): string | undefined {
    return ICONS[symbol];
}
