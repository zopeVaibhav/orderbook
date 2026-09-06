import chalk from 'chalk';
import { Side } from '@repo/database';
import { TimeInForce } from '@repo/types';
import { TAKE } from '../config/bots.config';
import { levelStep, type MarketSpec } from '../quotes/ladder';
import { placeOrder } from '../orders/submit';
import type { MarketMaker } from './maker';

const RUN_ID = Date.now().toString(36);

function poissonDelay(meanMs: number): number {
    return Math.max(250, Math.round(-Math.log(1 - Math.random()) * meanMs));
}

function pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)] as T;
}

export class Taker {
    readonly #market: MarketSpec;
    readonly #bots: string[];
    readonly #maker: MarketMaker;

    #timer: ReturnType<typeof setTimeout> | null = null;
    #seq = 0;
    #stopped = false;

    constructor(market: MarketSpec, bots: string[], maker: MarketMaker) {
        this.#market = market;
        this.#bots = bots;
        this.#maker = maker;
    }

    start(): void {
        this.#stopped = false;
        this.#schedule();
    }

    stop(): void {
        this.#stopped = true;
        if (this.#timer) clearTimeout(this.#timer);
        this.#timer = null;
    }

    #schedule(): void {
        if (this.#stopped) return;
        this.#timer = setTimeout(() => void this.#fire(), poissonDelay(TAKE.MEAN_INTERVAL_MS));
    }

    async #fire(): Promise<void> {
        try {
            await this.#take();
        } catch (error) {
            console.error(chalk.red(`taker ${this.#market.id} failed:`), error);
        } finally {
            this.#schedule();
        }
    }

    async #take(): Promise<void> {
        const takerSide = Math.random() < 0.5 ? Side.BID : Side.ASK;
        const restingSide = takerSide === Side.BID ? Side.ASK : Side.BID;

        const touch = this.#maker.touch(restingSide, TAKE.SWEEP_DEPTH);
        if (!touch) return;

        const makers = new Set(touch.owners);
        const candidates = this.#bots.filter((bot) => !makers.has(bot));
        if (candidates.length === 0) return;

        const fraction =
            TAKE.MIN_SIZE_FRACTION +
            Math.random() * (TAKE.MAX_SIZE_FRACTION - TAKE.MIN_SIZE_FRACTION);

        const qtyLots = BigInt(Math.round(Number(touch.qtyLots) * fraction));
        if (qtyLots < this.#market.minQuantity) return;

        const reach = levelStep(this.#maker.mid, this.#market.tickExp) * BigInt(TAKE.SWEEP_DEPTH);
        const priceTicks =
            takerSide === Side.BID ? touch.priceTicks + reach : touch.priceTicks - reach;

        if (priceTicks <= 0n) return;

        this.#seq += 1;

        await placeOrder({
            userId: pick(candidates),
            clientOrderId: `tk-${this.#market.id.slice(0, 8)}-${RUN_ID}-${this.#seq}`,
            market: this.#market,
            side: takerSide,
            priceTicks,
            qtyLots,
            timeInForce: TimeInForce.IOC,
        });
    }
}
