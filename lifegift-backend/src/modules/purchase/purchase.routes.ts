import { Router } from 'express';
import { PurchaseOrderController } from './purchase.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { CreatePurchaseOrderDto, PurchaseOrderIdParamDto, UpdatePurchaseOrderStatusDto } from './purchase.dto';

const router = Router();

router.use(authenticateJwt);
router.use(requireAuth);
router.use(authorizeRoles('ADMIN'));

router.get('/', PurchaseOrderController.getAll);
router.get('/:id', validateParamsDto(PurchaseOrderIdParamDto), PurchaseOrderController.getById);
router.post('/', validateDto(CreatePurchaseOrderDto), PurchaseOrderController.create);
router.patch('/:id/status', validateParamsDto(PurchaseOrderIdParamDto), validateDto(UpdatePurchaseOrderStatusDto), PurchaseOrderController.updateStatus);
router.delete('/:id', validateParamsDto(PurchaseOrderIdParamDto), PurchaseOrderController.delete);

export default router;