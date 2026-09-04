import { OrderStatus } from '@repo/types';

/** Terminal means the engine is done with the order: no later ack may move
 *  it, and its whole reserve has been released. */
const TERMINAL: ReadonlySet<OrderStatus> = new Set([
    OrderStatus.FILLED,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
]);

export function isTerminal(status: OrderStatus): boolean {
    return TERMINAL.has(status);
}
