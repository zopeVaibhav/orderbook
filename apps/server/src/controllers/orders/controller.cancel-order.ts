import { Request, Response } from 'express';
import { z } from 'zod';
import { isTerminal, prisma } from '@repo/database';
import { ResponseWriter } from '../../services/service.response';
import OrderProducer from '../../kafka/producers/kafka.order-producer';

export const params_schema = z.object({
    clientOrderId: z.string().min(1).max(64),
});

export default class CancelOrderController {
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return ResponseWriter.unauthorized(res);

            const params = params_schema.safeParse(req.params);
            if (!params.success) {
                return ResponseWriter.invalidData(res, 'clientOrderId is required');
            }

            const { clientOrderId } = params.data;

            const order = await prisma.order.findUnique({
                where: { userId_clientOrderId: { userId, clientOrderId } },
                select: { marketId: true, status: true },
            });

            if (!order) return ResponseWriter.notFound(res, 'order not found');
            if (isTerminal(order.status)) {
                return ResponseWriter.invalidData(res, `order is already ${order.status}`);
            }

            await OrderProducer.publishCancelOrder({
                client_order_id: clientOrderId,
                user_id: userId,
                market_id: order.marketId,
            });

            return ResponseWriter.success(res, { clientOrderId }, 'cancel requested');
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
