import { Router } from 'express';
import { SignInController } from '../controllers/signInController';

const router: Router = Router();

router.post('/signin', SignInController);

export default router;
