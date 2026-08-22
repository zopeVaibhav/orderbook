import { prisma, Prisma, RefType, LedgerReason } from '@repo/database';
import { TradeOut } from './schema/trade.schema';

type MarketAssets = { base: string; quote: string };

const marketCache = new Map<string, MarketAssets>();

async function getMarket(marketId: string): Promise<MarketAssets> {
    const cached = marketCache.get(marketId);
    if (cached) return cached;

    const market = await prisma.markets.findUnique({
        where: { id: marketId },
        select: { base: true, quote: true },
    });

    if (!market) {
        throw new Error(`settlement: unknown market "${marketId}"`);
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

    const rows = [
        { userId: trade.taker_user_id, asset: baseAsset, amount: takerBase },
        { userId: trade.taker_user_id, asset: quoteAsset, amount: takerQuote },
        { userId: trade.maker_user_id, asset: baseAsset, amount: takerBase.neg() },
        { userId: trade.maker_user_id, asset: quoteAsset, amount: takerQuote.neg() },
    ].map((row) => ({
        ...row,
        refId,
        refType: RefType.TRADE,
        ledgerReason: LedgerReason.FILL,
    }));

    await prisma.ledgerEntry.createMany({
        data: rows,
        skipDuplicates: true,
    });
}
