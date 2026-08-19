import { Request, Response } from 'express';
import { ResponseWriter } from '../../services/service.response';
import { prisma } from '@repo/database';

export default class MarketController {
    static async process(req: Request, res: Response) {
        try {
            const markets = await prisma.markets.findMany({
                where: { status: 'ACTIVE' },
                select: {
                    id: true,
                    base: true,
                    quote: true,
                    tickExp: true,
                    lotExp: true,
                    minQuantity: true,
                    makerFeeBps: true,
                    takerFeeBps: true,
                    baseRef: { select: { name: true, decimals: true } },
                    quoteRef: { select: { name: true, decimals: true } },
                },
                orderBy: { id: 'asc' },
            });

            const response = markets.map((m) => ({
                ...m,
                minQuantity: m.minQuantity.toString(),
            }));

            ResponseWriter.created(res, { markets: response });
        } catch (error) {
            ResponseWriter.created(res, error);
        }
    }
}
