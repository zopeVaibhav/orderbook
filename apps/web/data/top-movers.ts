export type TopMover = {
    symbol: string;
    price: number;
    change24h: number;
};

export const TOP_MOVERS: TopMover[] = [
    { symbol: 'PENDLE-PERP', price: 1.3215, change24h: 5.0 },
    { symbol: 'RP', price: 0.02089, change24h: 1.06 },
    { symbol: 'W-PERP', price: 0.008289, change24h: -1.78 },
    { symbol: 'PENGU-PERP', price: 0.006013, change24h: 2.06 },
    { symbol: '2Z-PERP', price: 0.04876, change24h: 1.52 },
    { symbol: 'kBONK-PERP', price: 0.00231, change24h: -0.42 },
    { symbol: 'DOGE-PERP', price: 0.183, change24h: 3.21 },
    { symbol: 'SOL-PERP', price: 178.42, change24h: 4.12 },
    { symbol: 'ARB-PERP', price: 0.812, change24h: 5.71 },
];
