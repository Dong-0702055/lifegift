import { Router } from 'express';
import { AgencyLeadController } from './agency-lead.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { AgencyLeadIdParamDto, CreateAgencyLeadDto, UpdateAgencyLeadStatusDto } from './agency-lead.dto';

const router = Router();

router.post('/', validateDto(CreateAgencyLeadDto), AgencyLeadController.create);
router.get('/', authenticateJwt, requireAuth, authorizeRoles('ADMIN'), AgencyLeadController.getAll);
router.patch(
  '/:id/status',
  authenticateJwt,
  requireAuth,
  authorizeRoles('ADMIN'),
  validateParamsDto(AgencyLeadIdParamDto),
  validateDto(UpdateAgencyLeadStatusDto),
  AgencyLeadController.updateStatus,
);

export default router;