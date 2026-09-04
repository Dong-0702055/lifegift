import { Router } from 'express';
import { CategoryController } from './category.controller';
import { validateDto } from '../../common/middlewares/validation.middleware';
import { CategoryDto } from './category.dto';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';

const router = Router();

// Public Endpoints
router.get('/', CategoryController.getCategories);
router.get('/:id', CategoryController.getCategory);

// Protected Endpoints (Cần xác thực ADMIN)
router.post(
  '/',
  authenticateJwt,
  requireAuth,
  authorizeRoles('ADMIN'),
  validateDto(CategoryDto),
  CategoryController.createCategory
);

router.put(
  '/:id',
  authenticateJwt,
  requireAuth,
  authorizeRoles('ADMIN'),
  validateDto(CategoryDto),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  authenticateJwt,
  requireAuth,
  authorizeRoles('ADMIN'),
  CategoryController.deactivateCategory
);

export default router;