import { Router } from 'express';
import { authUser } from '../../middlewares/auth-user';
import { walletController } from './controller';

const router = Router();

router.get('/', authUser, (req, res) => walletController.getWallet(req, res));
router.get('/transactions', authUser, (req, res) => walletController.listTransactions(req, res));

export default router;
