import { OrderKind, prisma, releaseRemaining, TimeInForce } from '@repo/database';
import type { AckStatus, OrderAck } from '@repo/types/kafka';
import { isTerminal } from '../../services/service.order-status';

const RELEASES_REMAINDER: ReadonlySet<AckStatus> = new Set(['CANCELLED', 'REJECTED']);
const NEVER_RESTS: ReadonlySet<TimeInForce> = new Set([TimeInForce.IOC, TimeInForce.FOK]);

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
    const filled = ack.status === 'PARTIAL' ? ack.filled_qty : undefined;
    await releaseRemaining(ack.user_id, ack.client_order_id, filled);
}
