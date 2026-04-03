import { Router } from 'express';
import { webhookController } from './controller';
import { sessionAuth } from '../../middlewares/session-auth.middleware';

export const webhookRouter = Router();
webhookRouter.get('/', sessionAuth, webhookController.list);
webhookRouter.get('/logs', sessionAuth, webhookController.logs);
webhookRouter.get('/:id', sessionAuth, webhookController.getById);
webhookRouter.get('/:id/deliveries', sessionAuth, webhookController.deliveries);
webhookRouter.post('/resend', sessionAuth, webhookController.resend);
