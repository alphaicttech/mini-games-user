import { Router } from 'express';
import { userAuthController } from './controller';
import { validate } from '../../../middlewares/validate';
import { telegramLoginSchema } from './validator';
import { authUser } from '../../../middlewares/auth-user';
import { rateLimit } from '../../../middlewares/rate-limit';

const router = Router();

router.post('/telegram/login', rateLimit('auth:telegram', 15, 60), validate(telegramLoginSchema), (req, res) => userAuthController.login(req, res));
router.post('/logout', authUser, (req, res) => userAuthController.logout(req, res));
router.get('/me', authUser, (req, res) => userAuthController.me(req, res));
router.get('/sessions', authUser, (req, res) => userAuthController.sessions(req, res));
router.delete('/sessions/:sessionId', authUser, (req, res) => userAuthController.deleteSession(req, res));
router.delete('/sessions', authUser, (req, res) => userAuthController.logoutOthers(req, res));

export default router;
