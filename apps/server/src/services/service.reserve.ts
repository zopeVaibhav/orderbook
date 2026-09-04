import { LedgerReason, Prisma, prisma, RefType, writeLedger } from '@repo/database';
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

        const balance = await tx.balance.findUnique({
            where: { userId_asset: { userId, asset: reserve.asset } },
            select: { available: true },
        });

        const available = balance?.available ?? new Prisma.Decimal(0);
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

        await writeLedger(tx, [
            {
                userId,
                asset: reserve.asset,
                amount: reserve.amount.neg(),
                ledgerReason: LedgerReason.RESERVE,
                refType: RefType.ORDER,
                refId: input.clientOrderId,
            },
        ]);
    });

    return shortfall ? { ok: false, reason: shortfall } : { ok: true };
}

export async function releaseReserve(userId: string, clientOrderId: string): Promise<void> {
    const reserve = await prisma.ledgerEntry.findFirst({
        where: { userId, refId: clientOrderId, refType: 'ORDER', ledgerReason: 'RESERVE' },
    });

    if (!reserve) return;

    await prisma.$transaction((tx) =>
        writeLedger(tx, [
            {
                userId,
                asset: reserve.asset,
                amount: reserve.amount.neg(),
                ledgerReason: LedgerReason.RELEASE,
                refType: RefType.ORDER,
                refId: clientOrderId,
            },
        ]),
    );
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

    await prisma.$transaction((tx) =>
        writeLedger(tx, [
            {
                userId,
                asset,
                amount,
                ledgerReason: LedgerReason.RELEASE,
                refType: RefType.ORDER,
                refId: clientOrderId,
            },
        ]),
    );
}
