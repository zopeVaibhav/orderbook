import { Request, Response } from 'express';
import { ResponseWriter } from '../../services/service.response';
import { prisma } from '@repo/database';

export default class BalanceController {
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return ResponseWriter.unauthorized(res);
            }

            const rows = await prisma.balance.findMany({
                where: { userId },
                select: { asset: true, available: true, locked: true },
                orderBy: { asset: 'asc' },
            });

            const balance = rows.map((row) => ({
                asset: row.asset,
                available: row.available.toString(),
                locked: row.locked.toString(),
            }));

            return ResponseWriter.success(res, { balance: balance });
        } catch (error) {
            ResponseWriter.systemError(res, error);
        }
    }
}
