import {
    acceptOrder,
    OrderKind,
    OrderStatus,
    prisma,
    releaseReserve,
    Side,
    TimeInForce,
    reserveFor,
} from '@repo/database';
import { isJsonSafe, unscale } from '@repo/money';
import { EngineOrderKind } from '@repo/types/kafka';
import OrderProducer from './producer';
import type { MarketSpec } from '../quotes/ladder';

const ENGINE_KIND: Record<'POST_ONLY' | 'IOC', EngineOrderKind> = {
    POST_ONLY: EngineOrderKind.POST_ONLY,
    IOC: EngineOrderKind.IOC,
};

export type PlaceInput = {
    userId: string;
    clientOrderId: string;
    market: MarketSpec;
    side: Side;
    priceTicks: bigint;
    qtyLots: bigint;
    timeInForce: 'POST_ONLY' | 'IOC';
};

export type PlaceResult = { ok: true } | { ok: false; reason: string };

export async function placeOrder(input: PlaceInput): Promise<PlaceResult> {
    const { market, userId, clientOrderId } = input;

    if (input.qtyLots < market.minQuantity) {
        return { ok: false, reason: 'below market minimum' };
    }

    if (!isJsonSafe(input.qtyLots, input.priceTicks)) {
        return { ok: false, reason: 'order is too large to encode' };
    }

    const price = unscale(input.priceTicks, market.tickExp);
    const quantity = unscale(input.qtyLots, market.lotExp);

    const reserve = reserveFor(market, input.side, OrderKind.LIMIT, price, quantity);
    if (!reserve) return { ok: false, reason: 'no reserve target' };

    let accepted;
    try {
        accepted = await acceptOrder({
            userId,
            clientOrderId,
            marketId: market.id,
            side: input.side,
            kind: OrderKind.LIMIT,
            timeInForce: input.timeInForce as TimeInForce,
            price,
            quantity,
            reserve,
        });
    } catch (error) {
        return { ok: false, reason: `reserve failed: ${error}` };
    }

    if (!accepted.ok) return { ok: false, reason: accepted.reason };

    try {
        await OrderProducer.publishNewOrder({
            client_order_id: clientOrderId,
            user_id: userId,
            market_id: market.id,
            side: input.side,
            order_kind: ENGINE_KIND[input.timeInForce],
            price: Number(input.priceTicks),
            quantity: Number(input.qtyLots),
        });
    } catch (error) {
        await releaseReserve(userId, clientOrderId);
        await prisma.order.update({
            where: { userId_clientOrderId: { userId, clientOrderId } },
            data: { status: OrderStatus.REJECTED, rejectReason: 'publish failed' },
        });
        return { ok: false, reason: `publish failed: ${error}` };
    }

    return { ok: true };
}

export async function cancelOrder(
    userId: string,
    marketId: string,
    clientOrderId: string,
): Promise<void> {
    await OrderProducer.publishCancelOrder({
        client_order_id: clientOrderId,
        user_id: userId,
        market_id: marketId,
    });
}
