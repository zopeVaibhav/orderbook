/**
 * Anchor price per base asset, in quote units. Nothing here reads an oracle:
 * these are the starting points the random walk drifts from, so edit freely.
 */
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

/** Quote-denominated worth of each asset handed to each bot at funding time.
 *  Large enough that a bot cannot be drained by a human working one market. */
export const BOT_INVENTORY_NOTIONAL = '2000000';

/** Bots are distinct User rows on purpose: the engine cancels a resting maker
 *  when the taker shares its user id, so one shared identity eats its own book. */
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

/** RFC 2606 reserves .invalid, so no bot address can ever be a real mailbox
 *  and no bot can be signed into through Google. */
export const BOT_EMAIL_DOMAIN = 'bots.invalid';

export function botEmail(handle: string): string {
    return `${handle}@${BOT_EMAIL_DOMAIN}`;
}

/** Ladder shape. Spread and step are in basis points of mid, so one set of
 *  numbers works for BTC at 95000 and PEPE at 0.00001 alike. */
export const QUOTE = {
    LEVELS: 40,
    SPREAD_BPS: 8,
    LEVEL_STEP_BPS: 6,
    BASE_NOTIONAL: 2500,
    SIZE_GROWTH: 1.06,
    REFRESH_MS: 1500,
    /** Repricing is capped per tick and taken innermost first, so the touch
     *  stays fresh, deep levels lag, and the book is never emptied wholesale. */
    MAX_ACTIONS_PER_TICK: 8,
};

/** Reversion is what keeps a market from wandering off its anchor over a long
 *  session; without it a random walk eventually leaves the seeded price far behind. */
export const WALK = {
    VOL_BPS: 12,
    REVERSION: 0.02,
};

/** How often the enabled-market set is re-read, so a toggle in the UI takes
 *  effect without restarting the service. */
export const REGISTRY_POLL_MS = 5000;

/** Taker flow. Without it the ladder just sits there: nothing prints a trade,
 *  so there is no tape and no candles. */
export const TAKE = {
    MEAN_INTERVAL_MS: 4000,
    MIN_SIZE_FRACTION: 0.15,
    MAX_SIZE_FRACTION: 1.2,
    SWEEP_DEPTH: 3,
};
