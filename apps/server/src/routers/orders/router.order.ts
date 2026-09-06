import { Router } from 'express';
import AuthMiddleware from '../../middlewares/middleware.auth';
import PlaceOrderController from '../../controllers/orders/controller.place-order';
import CancelOrderController from '../../controllers/orders/controller.cancel-order';
import ListOrdersController from '../../controllers/orders/controller.list-orders';
import ListFillsController from '../../controllers/orders/controller.list-fills';

const router: Router = Router();

router.get('/orders', AuthMiddleware.process, ListOrdersController.process);
router.get('/fills', AuthMiddleware.process, ListFillsController.process);
router.post('/orders', AuthMiddleware.process, PlaceOrderController.process);
router.delete('/orders/:clientOrderId', AuthMiddleware.process, CancelOrderController.process);

export default router;
