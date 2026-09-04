import { Router } from 'express';
import MarketController from '../../controllers/market/controller.market';
import BookController from '../../controllers/market/controller.book';
import TradesController from '../../controllers/market/controller.trades';

const router: Router = Router();

router.get('/markets', MarketController.process);
router.get('/markets/:marketId/book', BookController.process);
router.get('/markets/:marketId/trades', TradesController.process);

export default router;
