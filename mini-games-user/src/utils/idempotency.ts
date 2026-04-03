import { redis } from '../config/redis';

export const withIdempotency = async <T>(key: string, ttlSec: number, fn: () => Promise<T>) => {
  const exists = await redis.get(key);
  if (exists) {
    return JSON.parse(exists) as T;
  }
  const result = await fn();
  await redis.set(key, JSON.stringify(result), 'EX', ttlSec);
  return result;
};
