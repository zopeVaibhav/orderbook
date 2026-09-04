import { prisma } from '@repo/database';
import type { AckStatus, OrderAck } from '@repo/types/kafka';
import { releaseRemaining } from '../../services/service.reserve';
import { isTerminal } from '../../services/service.order-status';

/** FILLED is absent on purpose: settlement releases each fill at the reserved
 *  price, so an ack racing trades.out here would release the same reserve twice. */
const RELEASES_REMAINDER: ReadonlySet<AckStatus> = new Set(['CANCELLED', 'REJECTED']);

export async function handleAck(ack: OrderAck): Promise<void> {
    const key = {
        userId_clientOrderId: { userId: ack.user_id, clientOrderId: ack.client_order_id },
    };

    const order = await prisma.order.findUnique({
        where: key,
        select: { engineSeq: true, status: true },
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

    if (RELEASES_REMAINDER.has(ack.status)) {
        await releaseRemaining(ack.user_id, ack.client_order_id);
    }
}
