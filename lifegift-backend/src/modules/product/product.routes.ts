import { Router } from 'express';
import { ProductController } from './product.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { BrandIdParamDto, CategoryIdParamDto, ProductDto, ProductIdParamDto } from './product.dto';

const router = Router();

// 1. PUBLIC ROUTES
router.get('/', ProductController.getProducts);
router.get('/:id', validateParamsDto(ProductIdParamDto), ProductController.getProduct);

// 2. ADMIN ONLY ROUTES
router.use(authenticateJwt);
router.use(requireAuth);
router.use(authorizeRoles('ADMIN'));

router.post('/', validateDto(ProductDto), ProductController.createProduct);
router.put('/:id', validateParamsDto(ProductIdParamDto), validateDto(ProductDto), ProductController.updateProduct);
router.delete('/:id', validateParamsDto(ProductIdParamDto), ProductController.deactivateProduct);
router.patch('/:id/activate', validateParamsDto(ProductIdParamDto), ProductController.activateProduct);
router.get('/category/:categoryId', validateParamsDto(CategoryIdParamDto), ProductController.getProductsByCategory);
router.get('/brand/:brandId', validateParamsDto(BrandIdParamDto), ProductController.getProductsByBrand);

export default router;