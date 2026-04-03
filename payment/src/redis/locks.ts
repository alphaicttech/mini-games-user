import { redis } from './index';

export async function withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const lockKey = `lock:${key}`;
  const lockValue = `${Date.now()}-${Math.random()}`;
  const acquired = await redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
  if (!acquired) {
    throw new Error(`Lock not acquired: ${key}`);
  }

  try {
    return await fn();
  } finally {
    const current = await redis.get(lockKey);
    if (current === lockValue) {
      await redis.del(lockKey);
    }
  }
}
