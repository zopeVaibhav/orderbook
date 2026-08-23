/**
 * Only symbols with a file here get an image; a guessed path would 404.
 */
const ICONS: Record<string, string> = {
    BTC: '/coins/bitcoin.svg',
};

export function marketIcon(symbol: string): string | undefined {
    return ICONS[symbol];
}
