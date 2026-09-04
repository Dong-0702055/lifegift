import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth } from '../../common/middlewares/auth.middleware';
import { OrderIdParamDto } from './payment.dto';

const router = Router();

router.use(authenticateJwt);
router.use(requireAuth);

router.get('/order/:orderId', validateParamsDto(OrderIdParamDto), PaymentController.getByOrderId);
router.post('/order/:orderId/success', validateParamsDto(OrderIdParamDto), PaymentController.markSuccess);
router.post('/order/:orderId/failed', validateParamsDto(OrderIdParamDto), PaymentController.markFailed);
router.post('/order/:orderId/refund', validateParamsDto(OrderIdParamDto), PaymentController.refund);

export default router;