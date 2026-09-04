import { OrderKind, prisma, releaseRemaining, TimeInForce } from '@repo/database';
import type { AckStatus, OrderAck } from '@repo/types/kafka';
import { isTerminal } from '../../services/service.order-status';

/** FILLED is absent on purpose: settlement releases each fill at the reserved
 *  price, so an ack racing trades.out here would release the same reserve twice. */
const RELEASES_REMAINDER: ReadonlySet<AckStatus> = new Set(['CANCELLED', 'REJECTED']);

const NEVER_RESTS: ReadonlySet<TimeInForce> = new Set([TimeInForce.IOC, TimeInForce.FOK]);

/** A partly filled IOC acks as PARTIAL like a resting order does, but its
 *  remainder was cancelled, so only the order's own kind says who holds it. */
function leftoverIsGone(
    status: AckStatus,
    kind: OrderKind,
    timeInForce: TimeInForce | null,
): boolean {
    if (RELEASES_REMAINDER.has(status)) return true;
    if (status !== 'PARTIAL') return false;

    return kind === OrderKind.MARKET || (timeInForce !== null && NEVER_RESTS.has(timeInForce));
}

export async function handleAck(ack: OrderAck): Promise<void> {
    const key = {
        userId_clientOrderId: { userId: ack.user_id, clientOrderId: ack.client_order_id },
    };

    const order = await prisma.order.findUnique({
        where: key,
        select: { engineSeq: true, status: true, kind: true, timeInForce: true },
    });

    if (!order) return;

    if (order.engineSeq !== null && order.engineSeq >= BigInt(ack.seq)) return;

    /** A rejected cancel carries the original order's id, so without this a
     *  cancel of a FILLED order would rewrite that row to REJECTED. */
    if (isTerminal(order.status)) return;

    await prisma.order.update({
        where: key,
        data: {
            status: ack.status,
            rejectReason: ack.reason,
            engineSeq: BigInt(ack.seq),
        },
    });

    if (!leftoverIsGone(ack.status, order.kind, order.timeInForce)) return;

    /** On a PARTIAL the ack's own count is authoritative and settlement may not
     *  have landed yet; a cancel ack always reports zero, so the row wins there. */
    const filled = ack.status === 'PARTIAL' ? ack.filled_qty : undefined;
    await releaseRemaining(ack.user_id, ack.client_order_id, filled);
}
