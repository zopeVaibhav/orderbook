import { Prisma, prisma } from '@repo/database';
import { OrderKind, Side } from '@repo/types';

type Market = { base: string; quote: string };

type ReserveTarget = { asset: string; amount: Prisma.Decimal };

export function reserveFor(
    market: Market,
    side: Side,
    kind: OrderKind,
    price: string | undefined,
    quantity: string,
): ReserveTarget | null {
    if (side === Side.ASK) {
        return { asset: market.base, amount: new Prisma.Decimal(quantity) };
    }

    if (kind === OrderKind.MARKET || price === undefined) {
        return null;
    }

    return {
        asset: market.quote,
        amount: new Prisma.Decimal(price).mul(new Prisma.Decimal(quantity)),
    };
}

export type AcceptOrderInput = {
    userId: string;
    clientOrderId: string;
    marketId: string;
    side: Side;
    kind: OrderKind;
    timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
    price?: string;
    quantity: string;
    reserve: ReserveTarget;
};

export type AcceptResult = { ok: true } | { ok: false; reason: string };

export async function acceptOrder(input: AcceptOrderInput): Promise<AcceptResult> {
    const { userId, reserve } = input;

    let shortfall: string | null = null;

    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}), hashtext(${reserve.asset}))`;

        const totals = await tx.ledgerEntry.aggregate({
            where: { userId, asset: reserve.asset },
            _sum: { amount: true },
        });

        const available = totals._sum.amount ?? new Prisma.Decimal(0);
        if (available.lessThan(reserve.amount)) {
            shortfall = `insufficient ${reserve.asset}: need ${reserve.amount}, have ${available}`;
            return;
        }

        await tx.order.create({
            data: {
                userId,
                marketId: input.marketId,
                clientOrderId: input.clientOrderId,
                side: input.side,
                kind: input.kind,
                timeInForce: input.timeInForce,
                price: input.price,
                quantity: input.quantity,
            },
        });

        await tx.ledgerEntry.create({
            data: {
                userId,
                asset: reserve.asset,
                amount: reserve.amount.neg(),
                ledgerReason: 'RESERVE',
                refType: 'ORDER',
                refId: input.clientOrderId,
            },
        });
    });

    return shortfall ? { ok: false, reason: shortfall } : { ok: true };
}

export async function releaseReserve(userId: string, clientOrderId: string): Promise<void> {
    const reserve = await prisma.ledgerEntry.findFirst({
        where: { userId, refId: clientOrderId, refType: 'ORDER', ledgerReason: 'RESERVE' },
    });

    if (!reserve) return;

    try {
        await prisma.ledgerEntry.create({
            data: {
                userId,
                asset: reserve.asset,
                amount: reserve.amount.neg(),
                ledgerReason: 'RELEASE',
                refType: 'ORDER',
                refId: clientOrderId,
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
        throw error;
    }
}

export async function releaseRemaining(userId: string, clientOrderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
        where: { userId_clientOrderId: { userId, clientOrderId } },
        select: {
            side: true,
            price: true,
            quantity: true,
            filledQuantity: true,
            marketRef: { select: { base: true, quote: true } },
        },
    });

    if (!order) return;

    const remaining = order.quantity.minus(order.filledQuantity);
    if (remaining.lessThanOrEqualTo(0)) return;

    const asset = order.side === Side.ASK ? order.marketRef.base : order.marketRef.quote;
    const amount =
        order.side === Side.ASK ? remaining : (order.price ?? new Prisma.Decimal(0)).mul(remaining);

    try {
        await prisma.ledgerEntry.create({
            data: {
                userId,
                asset,
                amount,
                ledgerReason: 'RELEASE',
                refType: 'ORDER',
                refId: clientOrderId,
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
        throw error;
    }
}
