import { Request, Response } from 'express';
import { z } from 'zod';
import { ResponseWriter } from '../../services/service.response';
import { snapshotOf } from '../../services/service.book';

export const params_schema = z.object({
    marketId: z.string().min(1),
});

export default class BookController {
    static async process(req: Request, res: Response) {
        try {
            const params = params_schema.safeParse(req.params);
            if (!params.success) return ResponseWriter.invalidData(res, 'marketId is required');

            const { marketId } = params.data;

            const book = snapshotOf(marketId);
            if (!book) {
                return ResponseWriter.success(res, {
                    book: { market_id: marketId, bids: [], asks: [], seq: 0 },
                });
            }
            return ResponseWriter.success(res, { book });
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
