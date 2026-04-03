import { Router } from 'express';
import { authUser } from '../../middlewares/auth-user';
import { usersController } from './controller';

const router = Router();

router.get('/me', authUser, (req, res) => usersController.me(req, res));
router.patch('/me', authUser, (req, res) => usersController.updateMe(req, res));

export default router;
