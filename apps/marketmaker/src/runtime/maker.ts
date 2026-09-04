import chalk from 'chalk';
import { prisma, Side } from '@repo/database';
import { QUOTE } from '../config/bots.config';
import { buildLadder, levelStep, type MarketSpec, type Quote } from '../quotes/ladder';
import { PriceWalk } from '../price/walk';
import { cancelOrder, placeOrder } from '../orders/submit';

const TERMINAL = new Set(['FILLED', 'CANCELLED', 'REJECTED']);

/** Client order ids stay unique per user forever, and cancelled rows are kept,
 *  so ids carry a per-run stamp rather than restarting a counter at one. */
const RUN_ID = Date.now().toString(36);

type Resting = {
    clientOrderId: string;
    userId: string;
    side: Side;
    level: number;
    priceTicks: bigint;
};

function slotKey(side: Side, level: number): string {
    return `${side}:${level}`;
}

/**
 * Quotes one market: a full ladder each side, kept alive by replacing whatever
 * has filled or drifted. One bot owns a given level so the book carries many
 * identities rather than one.
 */
export class MarketMaker {
    readonly #market: MarketSpec;
    readonly #bots: string[];
    readonly #walk: PriceWalk;

    #bySlot = new Map<string, Resting>();
    #timer: ReturnType<typeof setInterval> | null = null;
    #seq = 0;
    #ticking = false;

    constructor(market: MarketSpec, bots: string[], anchor: number) {
        this.#market = market;
        this.#bots = bots;
        this.#walk = new PriceWalk(anchor);
    }

    get marketId(): string {
        return this.#market.id;
    }

    async start(): Promise<void> {
        await this.#cancelStaleOrders();
        await this.#place(buildLadder(this.#market, this.#walk.price));

        this.#timer = setInterval(() => void this.#tick(), QUOTE.REFRESH_MS);
    }

    async stop(): Promise<void> {
        if (this.#timer) clearInterval(this.#timer);
        this.#timer = null;

        for (const resting of this.#bySlot.values()) {
            await cancelOrder(resting.userId, this.#market.id, resting.clientOrderId);
        }
        this.#bySlot.clear();
    }

    #botFor(side: Side, level: number): string {
        const offset = side === Side.ASK ? 1 : 0;
        return this.#bots[(level + offset) % this.#bots.length] as string;
    }

    #nextClientOrderId(side: Side, level: number): string {
        this.#seq += 1;
        const short = this.#market.id.slice(0, 8);
        return `mm-${short}-${RUN_ID}-${side === Side.ASK ? 'a' : 'b'}${level}-${this.#seq}`;
    }

    /** Anything this service left resting in a previous run is unknown to the
     *  new state map, so it is cancelled rather than orphaned on the book. */
    async #cancelStaleOrders(): Promise<void> {
        const stale = await prisma.order.findMany({
            where: {
                marketId: this.#market.id,
                userId: { in: this.#bots },
                status: { in: ['PENDING', 'RESTED', 'PARTIAL'] },
            },
            select: { userId: true, clientOrderId: true },
        });

        for (const order of stale) {
            await cancelOrder(order.userId, this.#market.id, order.clientOrderId);
        }
    }

    async #reconcile(): Promise<void> {
        if (this.#bySlot.size === 0) return;

        const tracked = [...this.#bySlot.values()];
        const rows = await prisma.order.findMany({
            where: { clientOrderId: { in: tracked.map((r) => r.clientOrderId) } },
            select: { clientOrderId: true, status: true },
        });

        const gone = new Set(
            rows.filter((row) => TERMINAL.has(row.status)).map((row) => row.clientOrderId),
        );

        for (const [slot, resting] of this.#bySlot) {
            if (gone.has(resting.clientOrderId)) this.#bySlot.delete(slot);
        }
    }

    async #place(quotes: Quote[]): Promise<void> {
        for (const quote of quotes) {
            const userId = this.#botFor(quote.side, quote.level);
            const clientOrderId = this.#nextClientOrderId(quote.side, quote.level);

            const result = await placeOrder({
                userId,
                clientOrderId,
                market: this.#market,
                side: quote.side,
                priceTicks: quote.priceTicks,
                qtyLots: quote.qtyLots,
                timeInForce: 'POST_ONLY',
            });

            if (!result.ok) continue;

            this.#bySlot.set(slotKey(quote.side, quote.level), {
                clientOrderId,
                userId,
                side: quote.side,
                level: quote.level,
                priceTicks: quote.priceTicks,
            });
        }
    }

    async #tick(): Promise<void> {
        if (this.#ticking) return;
        this.#ticking = true;

        try {
            await this.#reconcile();

            const mid = this.#walk.step();
            const target = buildLadder(this.#market, mid);

            /** A level is only worth replacing once mid has carried it a whole
             *  step away; without this every tick would restate the whole book. */
            const tolerance = levelStep(mid, this.#market.tickExp);

            const missing: Quote[] = [];
            const stale: Resting[] = [];

            for (const quote of target) {
                const resting = this.#bySlot.get(slotKey(quote.side, quote.level));

                if (!resting) {
                    missing.push(quote);
                    continue;
                }

                const drift =
                    resting.priceTicks > quote.priceTicks
                        ? resting.priceTicks - quote.priceTicks
                        : quote.priceTicks - resting.priceTicks;

                if (drift >= tolerance) stale.push(resting);
            }

            /** Refilling comes first so a burst of fills can never leave the
             *  book thinner while the budget is spent cancelling. */
            const refill = missing.sort((a, b) => a.level - b.level);
            await this.#place(refill.slice(0, QUOTE.MAX_ACTIONS_PER_TICK));

            const budget =
                QUOTE.MAX_ACTIONS_PER_TICK - Math.min(refill.length, QUOTE.MAX_ACTIONS_PER_TICK);

            for (const resting of stale.sort((a, b) => a.level - b.level).slice(0, budget)) {
                await cancelOrder(resting.userId, this.#market.id, resting.clientOrderId);
                this.#bySlot.delete(slotKey(resting.side, resting.level));
            }
        } catch (error) {
            console.error(chalk.red(`maker ${this.#market.id} tick failed:`), error);
        } finally {
            this.#ticking = false;
        }
    }
}
