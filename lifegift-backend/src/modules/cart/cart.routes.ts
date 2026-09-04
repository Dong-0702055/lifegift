import { Router } from 'express';
import { CartController } from './cart.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth } from '../../common/middlewares/auth.middleware';
import { AddCartItemRequestDto, CartItemIdParamDto, UpdateCartItemRequestDto } from './cart.dto';

const router = Router();

router.use(authenticateJwt);
router.use(requireAuth);

router.get('/', CartController.getMyCart);
router.post('/items', validateDto(AddCartItemRequestDto), CartController.addItem);
router.patch('/items/:cartItemId', validateParamsDto(CartItemIdParamDto), validateDto(UpdateCartItemRequestDto), CartController.updateItem);
router.delete('/items/:cartItemId', validateParamsDto(CartItemIdParamDto), CartController.removeItem);
router.delete('/', CartController.clearCart);

export default router;