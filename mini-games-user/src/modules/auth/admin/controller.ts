import { Request, Response } from 'express';
import { ok } from '../../../utils/api-response';
import { adminAuthService } from './service';
import { db } from '../../../db';
import { admins } from '../../../db/schema/index';
import { eq } from 'drizzle-orm';

export class AdminAuthController {
  async login(req: Request, res: Response) {
    const result = await adminAuthService.login(req.body.username, req.body.password, { ip: req.ip, user_agent: req.header('user-agent') });
    res.cookie('mg_session', result.session_id, { httpOnly: true, sameSite: 'lax' });
    res.json(ok('Admin login successful', result));
  }

  async logout(req: Request, res: Response) {
    if (req.session_id) await adminAuthService.logout(req.session_id);
    res.clearCookie('mg_session');
    res.json(ok('Admin logout successful'));
  }

  async me(req: Request, res: Response) {
    const admin = await db.query.admins.findFirst({ where: eq(admins.id, req.admin!.id) });
    res.json(ok('Admin profile', admin));
  }

  async sessions(req: Request, res: Response) {
    const data = await adminAuthService.mySessions(req.admin!.id);
    res.json(ok('Admin sessions', data));
  }

  async deleteSession(req: Request, res: Response) {
    await adminAuthService.logout(req.params.sessionId);
    res.json(ok('Admin session deleted'));
  }

  async logoutOthers(req: Request, res: Response) {
    await adminAuthService.logoutOtherSessions(req.admin!.id, req.session_id!);
    res.json(ok('Other admin sessions removed'));
  }
}

export const adminAuthController = new AdminAuthController();
