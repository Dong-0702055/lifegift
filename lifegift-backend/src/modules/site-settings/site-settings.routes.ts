import { Router } from 'express';
import { SiteSettingsController } from './site-settings.controller';
import { validateDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { UpdateSiteSettingsDto } from './site-settings.dto';

const router = Router();

router.get('/', SiteSettingsController.get);
router.put(
  '/',
  authenticateJwt,
  requireAuth,
  authorizeRoles('ADMIN'),
  validateDto(UpdateSiteSettingsDto),
  SiteSettingsController.update,
);

export default router;