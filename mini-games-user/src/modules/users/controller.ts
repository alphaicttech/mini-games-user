import { Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { usersService } from './service';

export class UsersController {
  async me(req: Request, res: Response) {
    const user = await usersService.getMe(req.user!.id);
    res.json(ok('User profile', user));
  }

  async updateMe(req: Request, res: Response) {
    const user = await usersService.updateMe(req.user!.id, req.body);
    res.json(ok('Profile updated', user));
  }
}

export const usersController = new UsersController();
