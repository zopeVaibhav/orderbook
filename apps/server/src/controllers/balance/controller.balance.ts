import { Request, Response } from 'express';
import { ResponseWriter } from '../../services/service.response';
import { Prisma, prisma } from '@repo/database';

export default class BalanceController {
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return ResponseWriter.unauthorized(res);
            }

            const [totals, reserves] = await Promise.all([
                prisma.ledgerEntry.groupBy({
                    by: ['asset'],
                    where: { userId },
                    _sum: {
                        amount: true,
                    },
                }),

                prisma.ledgerEntry.groupBy({
                    by: ['asset'],
                    where: { userId, ledgerReason: { in: ['RESERVE', 'RELEASE'] } },
                    _sum: {
                        amount: true,
                    },
                }),
            ]);

            const lockedByAsset = new Map(
                reserves.map((entry) => [
                    entry.asset,
                    (entry._sum.amount ?? new Prisma.Decimal(0)).negated(),
                ]),
            );

            const balance = totals.map((entry) => ({
                asset: entry.asset,
                available: (entry._sum.amount ?? new Prisma.Decimal(0)).toString(),
                locked: lockedByAsset.get(entry.asset)?.toString() ?? '0',
            }));

            return ResponseWriter.success(res, { balance: balance });
        } catch (error) {
            ResponseWriter.systemError(res, error);
        }
    }
}
