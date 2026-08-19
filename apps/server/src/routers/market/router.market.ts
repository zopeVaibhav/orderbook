import { Router } from 'express';
import MarketController from '../../controllers/market/controller.market';

const router: Router = Router();

router.get('/markets', MarketController.process);

export default router;
