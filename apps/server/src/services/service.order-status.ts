import { OrderStatus } from '@repo/types';

const TERMINAL: ReadonlySet<OrderStatus> = new Set([
    OrderStatus.FILLED,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
]);

export function isTerminal(status: OrderStatus): boolean {
    return TERMINAL.has(status);
}
