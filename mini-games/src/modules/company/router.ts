import { Router } from 'express';
import { companyController } from './controller';
import { sessionAuth } from '../../middlewares/session-auth.middleware';

export const companyRouter = Router();
companyRouter.get('/', sessionAuth, companyController.list);
companyRouter.get('/:id', sessionAuth, companyController.getById);
