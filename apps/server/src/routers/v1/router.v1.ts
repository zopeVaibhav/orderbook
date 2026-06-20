import { Router } from 'express';
import authRoutes from '../auth/router.auth';

const router: Router = Router();

router.use('/auth', authRoutes);

export default router;
