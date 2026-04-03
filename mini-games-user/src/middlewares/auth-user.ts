import { NextFunction, Request, Response } from 'express';
import { redis } from '../config/redis';
import { fail } from '../utils/api-response';

export const authUser = async (req: Request, res: Response, next: NextFunction) => {
  const sid = req.cookies?.mg_session || req.header('x-session-id');
  if (!sid) return res.status(401).json(fail('Unauthorized'));
  const key = `session:${sid}`;
  const raw = await redis.get(key);
  if (!raw) return res.status(401).json(fail('Session expired'));
  const data = JSON.parse(raw) as { user_id?: string; role: string };
  if (!data.user_id || data.role !== 'user') return res.status(403).json(fail('Forbidden'));
  req.user = { id: data.user_id, role: 'user' };
  req.session_id = sid;
  await redis.expire(key, 60 * 60 * 24 * 7);
  next();
};
