import { Router } from 'express';
import AuthMiddleware from '../../middlewares/middleware.auth';
import PlaceOrderController from '../../controllers/orders/controller.place-order';
import CancelOrderController from '../../controllers/orders/controller.cancel-order';

const router: Router = Router();

router.post('/orders', AuthMiddleware.process, PlaceOrderController.process);
router.delete('/orders/:clientOrderId', AuthMiddleware.process, CancelOrderController.process);

export default router;
