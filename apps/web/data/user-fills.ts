import type { UserFill } from '@/types/fill';

export const USER_FILLS: UserFill[] = [
    {
        id: 'f1',
        symbol: 'BTC',
        side: 'bid',
        size: 0.0125,
        price: 67432.5,
        timestamp: 1_736_000_000_000,
    },
    {
        id: 'f2',
        symbol: 'BTC',
        side: 'ask',
        size: 0.005,
        price: 67501.2,
        timestamp: 1_735_999_820_000,
    },
    {
        id: 'f3',
        symbol: 'SOL',
        side: 'bid',
        size: 12.4,
        price: 178.42,
        timestamp: 1_735_999_640_000,
    },
    {
        id: 'f4',
        symbol: 'ETH',
        side: 'ask',
        size: 0.42,
        price: 3421.11,
        timestamp: 1_735_999_400_000,
    },
    {
        id: 'f5',
        symbol: 'BTC',
        side: 'bid',
        size: 0.02,
        price: 67380.0,
        timestamp: 1_735_999_100_000,
    },
    {
        id: 'f6',
        symbol: 'HYPE',
        side: 'ask',
        size: 140,
        price: 24.51,
        timestamp: 1_735_998_800_000,
    },
    {
        id: 'f7',
        symbol: 'DOGE',
        side: 'bid',
        size: 2100,
        price: 0.183,
        timestamp: 1_735_998_500_000,
    },
    {
        id: 'f8',
        symbol: 'BTC',
        side: 'ask',
        size: 0.008,
        price: 67555.9,
        timestamp: 1_735_998_100_000,
    },
    { id: 'f9', symbol: 'ARB', side: 'bid', size: 300, price: 0.812, timestamp: 1_735_997_700_000 },
    {
        id: 'f10',
        symbol: 'BTC',
        side: 'bid',
        size: 0.015,
        price: 67290.4,
        timestamp: 1_735_997_300_000,
    },
];

export function formatFillTime(ts: number): string {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

export const ACCOUNT_BALANCE = {
    total: 12_483.52,
    available: 9_204.18,
};
