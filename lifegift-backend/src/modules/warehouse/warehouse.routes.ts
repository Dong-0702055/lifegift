import { Router } from 'express';
import { WarehouseController } from './warehouse.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { WarehouseDto, WarehouseIdParamDto } from './warehouse.dto';

const router = Router();

// 1. PUBLIC ROUTES (Dành cho hiển thị danh sách kho công khai nếu cần)
router.get('/', WarehouseController.getWarehouses);
router.get('/:id', validateParamsDto(WarehouseIdParamDto), WarehouseController.getWarehouse);

// 2. ADMIN ONLY ROUTES (Quản lý kho)
router.use(authenticateJwt);
router.use(requireAuth);
router.use(authorizeRoles('ADMIN'));

router.post('/', validateDto(WarehouseDto), WarehouseController.createWarehouse);
router.put('/:id', validateParamsDto(WarehouseIdParamDto), validateDto(WarehouseDto), WarehouseController.updateWarehouse);
router.delete('/:id', validateParamsDto(WarehouseIdParamDto), WarehouseController.deactivateWarehouse);
router.patch('/:id/activate', validateParamsDto(WarehouseIdParamDto), WarehouseController.activateWarehouse);

export default router;