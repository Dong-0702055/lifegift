import { Router } from 'express';
import { CouponController } from './coupon.controller';
import { validateDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { ApplyCouponDto, CreateCouponDto, UpdateCouponDto } from './coupon.dto';

const router = Router();

router.use(authenticateJwt);
router.use(requireAuth);

// Client Router
router.post('/apply', validateDto(ApplyCouponDto), CouponController.apply);

// Admin Router (Yêu cầu quyền ADMIN)
router.get('/', authorizeRoles('ADMIN'), CouponController.getAll);
router.get('/:id', authorizeRoles('ADMIN'), CouponController.getById);
router.post('/', authorizeRoles('ADMIN'), validateDto(CreateCouponDto), CouponController.create);
router.patch('/:id', authorizeRoles('ADMIN'), validateDto(UpdateCouponDto), CouponController.update);
router.delete('/:id', authorizeRoles('ADMIN'), CouponController.delete);

export default router;