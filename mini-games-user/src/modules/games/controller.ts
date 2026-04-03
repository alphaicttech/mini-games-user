import { Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { gamesService } from './service';

export class GamesController {
  async list(req: Request, res: Response) {
    await gamesService.syncGamesFromAdapter();
    const data = await gamesService.listActiveGames();
    res.json(ok('Games list', data));
  }

  async detail(req: Request, res: Response) {
    const data = await gamesService.getGameByCode(req.params.code);
    res.json(ok('Game detail', data));
  }

  async start(req: Request, res: Response) {
    const data = await gamesService.start(req.user!.id, req.params.code, req.body.bet_amount);
    res.status(201).json(ok('Game started', data));
  }

  async play(req: Request, res: Response) {
    const data = await gamesService.play(req.user!.id, req.params.code, req.body.session_id, req.body.action || {});
    res.json(ok('Game action processed', data));
  }

  async sessions(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const data = await gamesService.listSessions(req.user!.id, limit, (page - 1) * limit);
    res.json(ok('Game sessions', data, { page, limit }));
  }

  async sessionDetail(req: Request, res: Response) {
    const data = await gamesService.getSession(req.user!.id, req.params.id);
    res.json(ok('Game session detail', data));
  }
}

export const gamesController = new GamesController();
