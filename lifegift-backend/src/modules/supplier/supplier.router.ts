import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { CreateSupplierDto, SupplierIdParamDto, UpdateSupplierDto } from './supplier.dto';

const router = Router();

router.use(authenticateJwt);
router.use(requireAuth);
router.use(authorizeRoles('ADMIN'));

router.get('/', SupplierController.getAll);
router.get('/:id', validateParamsDto(SupplierIdParamDto), SupplierController.getById);
router.post('/', validateDto(CreateSupplierDto), SupplierController.create);
router.put('/:id', validateParamsDto(SupplierIdParamDto), validateDto(UpdateSupplierDto), SupplierController.update);
router.delete('/:id', validateParamsDto(SupplierIdParamDto), SupplierController.delete);

export default router;