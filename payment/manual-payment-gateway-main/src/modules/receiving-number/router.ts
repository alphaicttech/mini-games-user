import { Router } from 'express';
import { receivingNumberController } from './controller';
import { sessionAuth } from '../../middlewares/session-auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createReceivingNumberSchema, listReceivingNumbersSchema } from './validator';

export const receivingNumberRouter = Router();
receivingNumberRouter.get('/', sessionAuth, validate(listReceivingNumbersSchema), receivingNumberController.list);
receivingNumberRouter.post('/', sessionAuth, validate(createReceivingNumberSchema), receivingNumberController.create);
receivingNumberRouter.post('/:id/activate', sessionAuth, receivingNumberController.activate);
