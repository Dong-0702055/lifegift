import { Router } from 'express';
import { BrandController } from './brand.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { BrandDto } from './brand.dto';
import { UserIdParamDto } from '../user/user.dto';

const router = Router();

// 1. PUBLIC ROUTES - Mọi người dùng / Guest đều có thể xem
router.get('/', BrandController.getBrands);
router.get('/:id', validateParamsDto(UserIdParamDto), BrandController.getBrand);

// 2. ADMIN ONLY ROUTES - Yêu cầu Đăng nhập & có quyền ADMIN
router.use(authenticateJwt);
router.use(requireAuth);
router.use(authorizeRoles('ADMIN'));

// POST /api/brands - Tạo thương hiệu
router.post(
  '/',
  validateDto(BrandDto),
  BrandController.createBrand
);

// PUT /api/brands/:id - Cập nhật thương hiệu
router.put(
  '/:id',
  validateParamsDto(UserIdParamDto),
  validateDto(BrandDto),
  BrandController.updateBrand
);

// DELETE /api/brands/:id - Vô hiệu hóa thương hiệu
router.delete(
  '/:id',
  validateParamsDto(UserIdParamDto),
  BrandController.deactivateBrand
);

export default router;