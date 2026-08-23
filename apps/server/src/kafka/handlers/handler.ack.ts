import { prisma } from '@repo/database';
import type { OrderAck } from '@repo/types/kafka';
import { releaseReserve } from '../../services/service.reserve';

/**
 * RESTED and PARTIAL are still live on the book, so their hold stays.
 */
const TERMINAL = new Set(['FILLED', 'CANCELLED', 'REJECTED']);

export async function handleAck(ack: OrderAck): Promise<void> {
    const key = {
        userId_clientOrderId: { userId: ack.user_id, clientOrderId: ack.client_order_id },
    };

    /**
     * Kafka redelivers and reorders, so an older sequence must never overwrite newer state.
     */
    const order = await prisma.order.findUnique({ where: key, select: { engineSeq: true } });

    if (!order) return;

    if (order.engineSeq !== null && order.engineSeq >= BigInt(ack.seq)) return;

    await prisma.order.update({
        where: key,
        data: {
            status: ack.status,
            filledQuantity: ack.filled_qty,
            rejectReason: ack.reason,
            engineSeq: BigInt(ack.seq),
        },
    });

    if (TERMINAL.has(ack.status)) {
        await releaseReserve(ack.user_id, ack.client_order_id);
    }
}
