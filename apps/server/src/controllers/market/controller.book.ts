import { Request, Response } from 'express';
import { ResponseWriter } from '../../services/service.response';
import { snapshotOf } from '../../services/service.book';

export default class BookController {
    static async process(req: Request, res: Response) {
        try {
            const marketId = req.params.marketId;
            if (typeof marketId !== 'string' || marketId.length === 0) {
                return ResponseWriter.invalidData(res, 'marketId is required');
            }
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
