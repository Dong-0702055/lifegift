import { Router } from 'express';
import { GoodsReceiptController } from './goods-receipt.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { CreateGoodsReceiptDto, GoodsReceiptIdParamDto } from './goods-receipt.dto';

const router = Router();

router.use(authenticateJwt);
router.use(requireAuth);
router.use(authorizeRoles('ADMIN', 'STAFF'));

router.get('/', GoodsReceiptController.getAll);
router.get('/:id', validateParamsDto(GoodsReceiptIdParamDto), GoodsReceiptController.getById);
router.post('/', validateDto(CreateGoodsReceiptDto), GoodsReceiptController.create);

export default router;