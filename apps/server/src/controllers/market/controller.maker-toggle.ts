import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@repo/database';
import { ResponseWriter } from '../../services/service.response';
import { ENV } from '../../configs/env.config';

export const params_schema = z.object({
    marketId: z.string().min(1),
});

export const body_schema = z.object({
    enabled: z.boolean(),
});

export default class MakerToggleController {
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return ResponseWriter.unauthorized(res);

            const params = params_schema.safeParse(req.params);
            if (!params.success) return ResponseWriter.invalidData(res, 'marketId is required');

            const body = body_schema.safeParse(req.body);
            if (!body.success) return ResponseWriter.invalidData(res, 'enabled must be a boolean');

            const caller = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true },
            });

            if (!ENV.ADMIN_EMAIL || caller?.email !== ENV.ADMIN_EMAIL) {
                return ResponseWriter.unauthorized(res, 'not an admin');
            }

            const market = await prisma.markets.update({
                where: { id: params.data.marketId },
                data: { makerEnabled: body.data.enabled },
                select: { id: true, makerEnabled: true },
            });

            return ResponseWriter.success(res, { market });
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
