import { NextFunction, Request, Response } from 'express';
import { redis } from '../config/redis';
import { fail } from '../utils/api-response';

export const rateLimit = (keyPrefix: string, limit = 20, windowSec = 60) => async (req: Request, res: Response, next: NextFunction) => {
  const key = `${keyPrefix}:${req.ip}`;
  const value = await redis.incr(key);
  if (value === 1) await redis.expire(key, windowSec);
  if (value > limit) return res.status(429).json(fail('Too many requests'));
  next();
};
