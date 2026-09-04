import { WALK } from '../config/bots.config';

const BPS = 10_000;

function gaussian(): number {
    let u = 0;
    while (u === 0) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

/**
 * Mean-reverting random walk around a fixed anchor. No oracle is involved:
 * the anchor is whatever bots.config.ts seeds the asset at.
 */
export class PriceWalk {
    readonly #anchor: number;
    #price: number;

    constructor(anchor: number) {
        this.#anchor = anchor;
        this.#price = anchor;
    }

    get price(): number {
        return this.#price;
    }

    step(): number {
        const shock = (gaussian() * WALK.VOL_BPS) / BPS;
        const pull = ((this.#anchor - this.#price) / this.#anchor) * WALK.REVERSION;

        this.#price = this.#price * (1 + shock + pull);

        return this.#price;
    }
}
