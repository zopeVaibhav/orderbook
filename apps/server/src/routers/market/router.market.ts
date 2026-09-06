import { Router } from 'express';
import MarketController from '../../controllers/market/controller.market';
import BookController from '../../controllers/market/controller.book';
import MarketStatsController from '../../controllers/market/controller.market-stats';
import TradesController from '../../controllers/market/controller.trades';
import MakerToggleController from '../../controllers/market/controller.maker-toggle';
import AuthMiddleware from '../../middlewares/middleware.auth';

const router: Router = Router();

router.get('/markets', MarketController.process);
router.get('/markets/stats', MarketStatsController.process);
router.get('/markets/:marketId/book', BookController.process);
router.get('/markets/:marketId/trades', TradesController.process);
router.patch('/markets/:marketId/maker', AuthMiddleware.process, MakerToggleController.process);

export default router;
