import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';
import { UnauthorizedError } from '../lib/errors';
import { redis } from '../redis';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        companyId: string;
        role: string;
        sid: string;
      };
    }
  }
}

export async function sessionAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.header('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const token = bearerToken;
  if (!token) throw new UnauthorizedError();

  const decoded = jwt.verify(token, env.SESSION_SECRET) as { sid: string };
  const payloadRaw = await redis.get(`session:${decoded.sid}`);
  if (!payloadRaw) throw new UnauthorizedError('Session expired');

  const payload = JSON.parse(payloadRaw) as { userId: string; companyId: string; role: string };
  req.auth = { ...payload, sid: decoded.sid };
  next();
}
