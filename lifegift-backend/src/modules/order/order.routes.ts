import { Router } from 'express';
import { OrderController } from './order.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth } from '../../common/middlewares/auth.middleware';
import { CreateOrderRequestDto, OrderIdParamDto, UpdateOrderStatusDto } from './order.dto';

const router = Router();

router.use(authenticateJwt);
router.use(requireAuth);

router.post('/', validateDto(CreateOrderRequestDto), OrderController.create);
router.get('/', OrderController.getAll);
router.get('/my', OrderController.getMyOrders);
router.get('/:id', validateParamsDto(OrderIdParamDto), OrderController.getById);
router.patch('/:id/status', validateParamsDto(OrderIdParamDto),validateDto(UpdateOrderStatusDto), OrderController.updateStatus);

export default router;