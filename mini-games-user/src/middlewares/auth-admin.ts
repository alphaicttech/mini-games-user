import { NextFunction, Request, Response } from 'express';
import { redis } from '../config/redis';
import { fail } from '../utils/api-response';
import { ROLE_PERMISSIONS } from '../constants/permissions';

export const authAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const sid = req.cookies?.mg_session || req.header('x-session-id');
  if (!sid) return res.status(401).json(fail('Unauthorized'));
  const raw = await redis.get(`session:${sid}`);
  if (!raw) return res.status(401).json(fail('Session expired'));
  const data = JSON.parse(raw) as { admin_id?: string; role: string };
  if (!data.admin_id) return res.status(403).json(fail('Forbidden'));
  req.admin = { id: data.admin_id, role: data.role };
  req.session_id = sid;
  next();
};

export const requirePermission = (permission: string) => (req: Request, res: Response, next: NextFunction) => {
  const role = req.admin?.role || '';
  const perms = ROLE_PERMISSIONS[role] || [];
  if (!perms.includes(permission)) return res.status(403).json(fail('Missing permission'));
  next();
};
