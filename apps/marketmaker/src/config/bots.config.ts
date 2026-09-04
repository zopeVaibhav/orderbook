export const SEED_PRICES: Record<string, string> = {
    BTC: '95000',
    ETH: '3200',
    SOL: '180',
    AVAX: '28',
    MATIC: '0.35',
    DOGE: '0.16',
    XRP: '2.1',
    ADA: '0.62',
    DOT: '5.2',
    LINK: '18',
    UNI: '8.5',
    ATOM: '5.4',
    NEAR: '4.2',
    APT: '7.8',
    ARB: '0.55',
    OP: '1.2',
    LTC: '105',
    BCH: '480',
    HYPE: '32',
    PEPE: '0.00001',
};

export const BOT_INVENTORY_NOTIONAL = '2000000';

export const BOT_HANDLES = [
    'northwind',
    'tidewater',
    'brightsea',
    'lowlatency',
    'quietriver',
    'ashfall',
    'meridian',
    'copperline',
    'stillwater',
    'harborlight',
] as const;

export const BOT_EMAIL_DOMAIN = 'bots.invalid';

export function botEmail(handle: string): string {
    return `${handle}@${BOT_EMAIL_DOMAIN}`;
}

export const QUOTE = {
    LEVELS: 40,
    SPREAD_BPS: 8,
    LEVEL_STEP_BPS: 6,
    BASE_NOTIONAL: 2500,
    SIZE_GROWTH: 1.06,
    REFRESH_MS: 1500,
    MAX_ACTIONS_PER_TICK: 8,
};

export const WALK = {
    VOL_BPS: 12,
    REVERSION: 0.02,
};

export const REGISTRY_POLL_MS = 5000;

export const TAKE = {
    MEAN_INTERVAL_MS: 4000,
    MIN_SIZE_FRACTION: 0.15,
    MAX_SIZE_FRACTION: 1.2,
    SWEEP_DEPTH: 3,
};
