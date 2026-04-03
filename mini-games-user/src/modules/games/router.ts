import { Router } from 'express';
import { authUser } from '../../middlewares/auth-user';
import { gamesController } from './controller';

const router = Router();

router.get('/sessions', authUser, (req, res) => gamesController.sessions(req, res));
router.get('/sessions/:id', authUser, (req, res) => gamesController.sessionDetail(req, res));
router.get('/', authUser, (req, res) => gamesController.list(req, res));
router.get('/:code', authUser, (req, res) => gamesController.detail(req, res));
router.post('/:code/start', authUser, (req, res) => gamesController.start(req, res));
router.post('/:code/play', authUser, (req, res) => gamesController.play(req, res));

export default router;
