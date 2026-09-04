import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { validateParamsDto } from '../../common/middlewares/validation.middleware';
import { UserIdParamDto } from './user.dto';

const router = Router();

// 1. Áp dụng Middleware giải mã JWT cho toàn bộ sub-routes
router.use(authenticateJwt);

// 2. Middleware bắt buộc phải Đăng nhập
router.use(requireAuth);

// GET /api/users - Chỉ dành cho ADMIN
router.get('/', authorizeRoles('ADMIN'), UserController.getAll);

// GET /api/users/:id - Validate ID phải là số + Yêu cầu quyền ADMIN
router.get('/:id', authorizeRoles('ADMIN'), validateParamsDto(UserIdParamDto), UserController.getById);

export default router;