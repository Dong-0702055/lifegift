import { Router } from 'express';
import { BlogController } from './blog.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import {
  BlogCategoryDto,
  BlogCategoryIdParamDto,
  BlogIdParamDto,
  BlogPostDto,
  BlogSlugParamDto,
} from './blog.dto';

const router = Router();

// ==========================================
// 1. PUBLIC ROUTES (Không cần đăng nhập)
// ==========================================
router.get('/categories', BlogController.getCategories);
router.get('/posts', BlogController.getPosts);
router.get('/posts/category/:categoryId', validateParamsDto(BlogCategoryIdParamDto), BlogController.getPostsByCategory);
router.get('/posts/slug/:slug', validateParamsDto(BlogSlugParamDto), BlogController.getPostBySlug);

// ==========================================
// 2. ADMIN ROUTES (Yêu cầu đăng nhập & Quyền ADMIN)
// ==========================================
router.use(authenticateJwt);
router.use(requireAuth);
router.use(authorizeRoles('ADMIN'));

// Category management
router.post('/categories', validateDto(BlogCategoryDto), BlogController.createCategory);

// Post management
router.post('/posts', validateDto(BlogPostDto), BlogController.createPost);
router.put('/posts/:id', validateParamsDto(BlogIdParamDto), validateDto(BlogPostDto), BlogController.updatePost);

export default router;