import { Router } from 'express';
import { SignInController } from '../../controllers/auth/controller.sign-in';

const router: Router = Router();

router.post('/signin', SignInController);

export default router;
