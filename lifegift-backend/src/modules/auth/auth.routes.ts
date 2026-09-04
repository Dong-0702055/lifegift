import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateDto } from '../../common/middlewares/validation.middleware';
import { LoginRequest, RegisterRequest, RefreshTokenRequest, LogoutRequest } from './auth.dto';

const router = Router();

router.post('/register', validateDto(RegisterRequest), AuthController.register);
router.post('/login', validateDto(LoginRequest), AuthController.login);
router.post('/refresh-token', validateDto(RefreshTokenRequest), AuthController.refreshToken);
router.post('/logout', validateDto(LogoutRequest), AuthController.logout);

export default router;