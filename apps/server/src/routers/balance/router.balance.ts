import { Router } from 'express';
import AuthMiddleware from '../../middlewares/middleware.auth';
import BalanceController from '../../controllers/balance/controller.balance';

const router: Router = Router();

router.get('/balance', AuthMiddleware.process, BalanceController.process);

export default router;
