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
