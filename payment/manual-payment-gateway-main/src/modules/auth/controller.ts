import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authService } from './service';
import { created, ok } from '../../lib/response';
import { env } from '../../env';

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password, {
      ip: req.ip,
      ua: req.header('user-agent')
    });

    created(res, { user: { id: result.user.id, email: result.user.email, role: result.user.role }, token: result.token });
  },

  async logout(req: Request, res: Response) {
    const authHeader = req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const token = bearerToken;
    if (token) {
      const decoded = jwt.verify(token, env.SESSION_SECRET) as { sid: string };
      await authService.logout(decoded.sid);
    }
    ok(res, { loggedOut: true });
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.auth!.userId);
    ok(res, { user });
  }
};
