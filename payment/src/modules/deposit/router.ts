import { Router } from 'express';
import { depositController } from './controller';
import { validate } from '../../middlewares/validate.middleware';
import { createDepositSchema, submitDepositSchema } from './validator';
import { idempotencyMiddleware } from '../../middlewares/idempotency.middleware';
import { sessionAuth } from '../../middlewares/session-auth.middleware';

export const depositRouter = Router();
depositRouter.get('/', sessionAuth, depositController.list);
depositRouter.get('/:id', sessionAuth, depositController.getById);
depositRouter.post('/', idempotencyMiddleware('deposit:create'), validate(createDepositSchema), depositController.create);
depositRouter.post('/:id/submit', idempotencyMiddleware('deposit:submit'), validate(submitDepositSchema), depositController.submit);
