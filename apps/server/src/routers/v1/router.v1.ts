import { Router } from 'express';
import authRoutes from '../auth/router.auth';
import balanceRoutes from '../balance/router.balance';
import marketRoutes from '../market/router.market';
import orderRoutes from '../orders/router.order';

export const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/', [balanceRoutes, marketRoutes, orderRoutes]);

export default router;
