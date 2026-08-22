import { Router } from 'express';
import AuthMiddleware from '../../middlewares/middleware.auth';
import PlaceOrderController from '../../controllers/orders/controller.place-order';

const router: Router = Router();

router.post('/orders', AuthMiddleware.process, PlaceOrderController.process);

export default router;
