import { Router } from 'express';
import { authUser } from '../../middlewares/auth-user';
import { depositsController } from './controller';
import { rateLimit } from '../../middlewares/rate-limit';

const router = Router();

router.post('/', authUser, (req, res) => depositsController.create(req, res));
router.get('/', authUser, (req, res) => depositsController.list(req, res));
router.get('/:id', authUser, (req, res) => depositsController.detail(req, res));
router.post('/:id/verify', authUser, rateLimit('deposit:verify', 20, 60), (req, res) => depositsController.verify(req, res));

export default router;
