import { Router } from 'express';
import { sessionAuth } from '../../middlewares/session-auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { idempotencyMiddleware } from '../../middlewares/idempotency.middleware';
import { withdrawalController } from './controller';
import {
  approveWithdrawalSchema,
  createWithdrawalSchema,
  getWithdrawalSchema,
  listWithdrawalsSchema,
  rejectWithdrawalSchema
} from './validator';

export const withdrawalRouter = Router();
withdrawalRouter.get('/', sessionAuth, validate(listWithdrawalsSchema), withdrawalController.list);
withdrawalRouter.get('/:id', sessionAuth, validate(getWithdrawalSchema), withdrawalController.getById);
withdrawalRouter.post('/', sessionAuth, idempotencyMiddleware('withdrawal:create'), validate(createWithdrawalSchema), withdrawalController.create);
withdrawalRouter.post('/:id/approve', sessionAuth, idempotencyMiddleware('withdrawal:approve'), validate(approveWithdrawalSchema), withdrawalController.approve);
withdrawalRouter.post('/:id/reject', sessionAuth, idempotencyMiddleware('withdrawal:reject'), validate(rejectWithdrawalSchema), withdrawalController.reject);
