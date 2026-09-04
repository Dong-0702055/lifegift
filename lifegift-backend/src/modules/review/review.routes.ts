import { Router } from 'express';
import { ReviewController } from './review.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { CreateReviewDto, ReviewIdParamDto, UpdateReviewStatusDto,ReviewProductIdParamDto, } from './review.dto';
import { ProductIdParamDto } from '../product/product.dto';

const router = Router();

// 1. PUBLIC ROUTES
router.get('/:productId', validateParamsDto(ReviewProductIdParamDto), ReviewController.getProductReviews);

// 2. USER ROUTES (Bắt buộc đăng nhập)
router.post(
  '/',
  authenticateJwt,
  requireAuth,
  validateDto(CreateReviewDto),
  ReviewController.createReview
);

// 3. ADMIN ROUTES
router.get(
  '/admin',
  authenticateJwt,
  requireAuth,
  authorizeRoles('ADMIN'),
  ReviewController.getAllReviews
);

router.patch(
  '/:id/status',
  authenticateJwt,
  requireAuth,
  authorizeRoles('ADMIN'),
  validateParamsDto(ReviewIdParamDto),
  validateDto(UpdateReviewStatusDto),
  ReviewController.updateReviewStatus
);

export default router;