import { NextFunction, Request, Response } from 'express';
import { redis } from '../redis';

export function idempotencyMiddleware(scope: string, ttlSeconds = 600) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.header('idempotency-key');
    if (!key) return next();

    const redisKey = `idem:${scope}:${key}`;
    const exists = await redis.get(redisKey);
    if (exists) {
      res.status(409).json({ success: false, code: 'IDEMPOTENCY_REPLAY', message: 'Request already processed' });
      return;
    }

    await redis.set(redisKey, '1', 'EX', ttlSeconds);
    next();
  };
}
