const ICONS: Record<string, string> = {
    BTC: '/coins/bitcoin.svg',
};

export function marketIcon(symbol: string): string | undefined {
    return ICONS[symbol];
}
