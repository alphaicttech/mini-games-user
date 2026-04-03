import { Request, Response } from 'express';
import { ok } from '../../../utils/api-response';
import { userAuthService } from './service';
import { db } from '../../../db';
import { users } from '../../../db/schema/index';
import { eq } from 'drizzle-orm';

export class UserAuthController {
  async login(req: Request, res: Response) {
    const result = await userAuthService.loginWithTelegram(req.body, { ip: req.ip, user_agent: req.header('user-agent') });
    res.cookie('mg_session', result.session_id, { httpOnly: true, secure: false, sameSite: 'lax' });
    res.json(ok('Login successful', result));
  }

  async logout(req: Request, res: Response) {
    if (req.session_id) await userAuthService.logout(req.session_id);
    res.clearCookie('mg_session');
    res.json(ok('Logged out'));
  }

  async me(req: Request, res: Response) {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.id) });
    res.json(ok('Current user', user));
  }

  async sessions(req: Request, res: Response) {
    const data = await userAuthService.mySessions(req.user!.id);
    res.json(ok('Active sessions', data));
  }

  async deleteSession(req: Request, res: Response) {
    const sessionId = req.params.sessionId;
    await userAuthService.logout(sessionId);
    res.json(ok('Session deleted'));
  }

  async logoutOthers(req: Request, res: Response) {
    await userAuthService.logoutOtherSessions(req.user!.id, req.session_id!);
    res.json(ok('Other sessions cleared'));
  }
}

export const userAuthController = new UserAuthController();
