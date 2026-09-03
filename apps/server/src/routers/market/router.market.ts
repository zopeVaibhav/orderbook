import { Router } from 'express';
import MarketController from '../../controllers/market/controller.market';
import BookController from '../../controllers/market/controller.book';

const router: Router = Router();

router.get('/markets', MarketController.process);
router.get('/markets/:marketId/book', BookController.process);

export default router;
