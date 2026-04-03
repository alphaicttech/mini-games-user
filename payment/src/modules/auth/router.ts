import { Router } from 'express';
import { authController } from './controller';
import { validate } from '../../middlewares/validate.middleware';
import { loginSchema } from './validator';
import { sessionAuth } from '../../middlewares/session-auth.middleware';

export const authRouter = Router();
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', sessionAuth, authController.me);
