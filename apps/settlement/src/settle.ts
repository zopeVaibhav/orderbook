import { prisma, Prisma, RefType, LedgerReason } from '@repo/database';
import { TradeOut } from './schema/trade.schema';

type MarketAssets = { base: string; quote: string };

const marketCache = new Map<string, MarketAssets>();

export class UnknownMarketError extends Error {}

async function getMarket(marketId: string): Promise<MarketAssets> {
    const cached = marketCache.get(marketId);
    if (cached) return cached;

    const market = await prisma.markets.findUnique({
        where: { id: marketId },
        select: { base: true, quote: true },
    });

    if (!market) {
        throw new UnknownMarketError(`settlement: unknown market "${marketId}"`);
    }

    marketCache.set(marketId, market);
    return market;
}

export async function settleTrade(trade: TradeOut): Promise<void> {
    const { base: baseAsset, quote: quoteAsset } = await getMarket(trade.market_id);

    const baseAmount = new Prisma.Decimal(trade.quantity);
    const quoteAmount = new Prisma.Decimal(trade.price).mul(baseAmount);

    const takerBuysBase = trade.taker_side === 'BID';
    const takerBase = takerBuysBase ? baseAmount : baseAmount.neg();
    const takerQuote = takerBuysBase ? quoteAmount.neg() : quoteAmount;

    const refId = `${trade.market_id}:${trade.trade_id}`;

    const bidUserId = takerBuysBase ? trade.taker_user_id : trade.maker_user_id;
    const bidClientOrderId = takerBuysBase
        ? trade.taker_client_order_id
        : trade.maker_client_order_id;
    const askUserId = takerBuysBase ? trade.maker_user_id : trade.taker_user_id;

    const bidOrder = await prisma.order.findUnique({
        where: { userId_clientOrderId: { userId: bidUserId, clientOrderId: bidClientOrderId } },
        select: { price: true },
    });
    if (!bidOrder?.price) {
        throw new Error(`settlement: missing reserved price for order "${bidClientOrderId}"`);
    }
    const quoteRelease = bidOrder.price.mul(baseAmount);

    const rows = [
        {
            userId: trade.taker_user_id,
            asset: baseAsset,
            amount: takerBase,
            ledgerReason: LedgerReason.FILL,
        },
        {
            userId: trade.taker_user_id,
            asset: quoteAsset,
            amount: takerQuote,
            ledgerReason: LedgerReason.FILL,
        },
        {
            userId: trade.maker_user_id,
            asset: baseAsset,
            amount: takerBase.neg(),
            ledgerReason: LedgerReason.FILL,
        },
        {
            userId: trade.maker_user_id,
            asset: quoteAsset,
            amount: takerQuote.neg(),
            ledgerReason: LedgerReason.FILL,
        },
        {
            userId: bidUserId,
            asset: quoteAsset,
            amount: quoteRelease,
            ledgerReason: LedgerReason.RELEASE,
        },
        {
            userId: askUserId,
            asset: baseAsset,
            amount: baseAmount,
            ledgerReason: LedgerReason.RELEASE,
        },
    ].map((row) => ({
        ...row,
        refId,
        refType: RefType.TRADE,
    }));

    await prisma.$transaction(async (tx) => {
        const inserted = await tx.ledgerEntry.createMany({
            data: rows,
            skipDuplicates: true,
        });
        if (inserted.count === 0) return;

        await tx.order.update({
            where: {
                userId_clientOrderId: {
                    userId: trade.taker_user_id,
                    clientOrderId: trade.taker_client_order_id,
                },
            },
            data: { filledQuantity: { increment: baseAmount } },
        });
        await tx.order.update({
            where: {
                userId_clientOrderId: {
                    userId: trade.maker_user_id,
                    clientOrderId: trade.maker_client_order_id,
                },
            },
            data: { filledQuantity: { increment: baseAmount } },
        });

        await tx.trade.create({
            data: {
                tradeId: BigInt(trade.trade_id),
                marketId: trade.market_id,
                price: new Prisma.Decimal(trade.price),
                quantity: baseAmount,
                makerUserId: trade.maker_user_id,
                makerClientOrderId: trade.maker_client_order_id,
                takerUserId: trade.taker_user_id,
                takerClientOrderId: trade.taker_client_order_id,
                takerSide: trade.taker_side,
                ts: BigInt(trade.ts),
                seq: BigInt(trade.seq),
            },
        });
    });
}
