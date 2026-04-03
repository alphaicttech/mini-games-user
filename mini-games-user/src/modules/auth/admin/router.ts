import { Router } from 'express';
import { validate } from '../../../middlewares/validate';
import { adminLoginSchema } from './validator';
import { adminAuthController } from './controller';
import { authAdmin } from '../../../middlewares/auth-admin';
import { rateLimit } from '../../../middlewares/rate-limit';

const router = Router();

router.post('/login', rateLimit('auth:admin', 10, 60), validate(adminLoginSchema), (req, res) => adminAuthController.login(req, res));
router.post('/logout', authAdmin, (req, res) => adminAuthController.logout(req, res));
router.get('/me', authAdmin, (req, res) => adminAuthController.me(req, res));
router.get('/sessions', authAdmin, (req, res) => adminAuthController.sessions(req, res));
router.delete('/sessions/:sessionId', authAdmin, (req, res) => adminAuthController.deleteSession(req, res));
router.delete('/sessions', authAdmin, (req, res) => adminAuthController.logoutOthers(req, res));

export default router;
