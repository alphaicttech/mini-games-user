import { Router } from 'express';
import { ok } from '../../lib/response';
import { sessionAuth } from '../../middlewares/session-auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { superAdminController } from './controller';
import { superAdminCreditCompanySchema, superAdminCreateDepositSchema } from './validator';

export const superAdminRouter = Router();
superAdminRouter.get('/reports/global', (_req, res) => ok(res, { message: 'global reports endpoint scaffolded' }));
superAdminRouter.post('/deposits', sessionAuth, validate(superAdminCreateDepositSchema), superAdminController.createDepositForCompany);
superAdminRouter.post('/companies/:companyId/charge', sessionAuth, validate(superAdminCreditCompanySchema), superAdminController.creditCompanyBalance);
