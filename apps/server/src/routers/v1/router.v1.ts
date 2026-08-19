import { Router } from 'express';
import authRoutes from '../auth/router.auth';
import balanceRoutes from '../balance/router.balance';

export const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/', balanceRoutes);

export default router;
