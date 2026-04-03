import { and, eq, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { env } from '../../../env';
import { db } from '../../../db';
import { sessions, users, wallets } from '../../../db/schema/index';
import { redis } from '../../../config/redis';
import { verifyTelegramPayload, TelegramPayload } from '../../../utils/telegram-verify';

export class UserAuthService {
  async loginWithTelegram(payload: TelegramPayload, metadata: { ip?: string; user_agent?: string }) {
    if (!verifyTelegramPayload(payload)) throw new Error('Invalid telegram payload');

    return db.transaction(async (tx) => {
      let user = await tx.query.users.findFirst({ where: eq(users.telegram_id, payload.id) });
      if (user?.status === 'BLOCKED') throw new Error('User is blocked');

      if (!user) {
        const [created] = await tx
          .insert(users)
          .values({
            telegram_id: payload.id,
            username: payload.username,
            first_name: payload.first_name,
            last_name: payload.last_name,
            display_name: [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim() || payload.username,
            photo_url: payload.photo_url,
            last_login_at: new Date(),
            last_ip: metadata.ip
          })
          .returning();
        user = created;
        await tx.insert(wallets).values({ user_id: user.id, currency: env.DEFAULT_CURRENCY });
      } else {
        const [updated] = await tx
          .update(users)
          .set({
            username: payload.username,
            first_name: payload.first_name,
            last_name: payload.last_name,
            display_name: [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim() || payload.username,
            photo_url: payload.photo_url,
            last_login_at: new Date(),
            last_ip: metadata.ip,
            updated_at: new Date()
          })
          .where(eq(users.id, user.id))
          .returning();
        user = updated;
      }

      const session_id = nanoid(32);
      const redisKey = `session:${session_id}`;
      const expires_at = new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);

      await tx.insert(sessions).values({
        user_id: user.id,
        role: 'user',
        redis_session_key: redisKey,
        ip: metadata.ip,
        user_agent: metadata.user_agent,
        expires_at
      });

      await redis.set(
        redisKey,
        JSON.stringify({ user_id: user.id, role: 'user', ip: metadata.ip, created_at: new Date().toISOString() }),
        'EX',
        env.SESSION_TTL_SECONDS
      );

      return { session_id, user };
    });
  }

  async logout(session_id: string) {
    await redis.del(`session:${session_id}`);
    await db.update(sessions).set({ is_active: false }).where(eq(sessions.redis_session_key, `session:${session_id}`));
  }

  async mySessions(user_id: string) {
    return db.query.sessions.findMany({ where: and(eq(sessions.user_id, user_id), eq(sessions.is_active, true)) });
  }

  async logoutOtherSessions(user_id: string, currentSessionId: string) {
    const all = await db.query.sessions.findMany({ where: and(eq(sessions.user_id, user_id), eq(sessions.is_active, true)) });
    for (const s of all) {
      if (s.redis_session_key !== `session:${currentSessionId}`) {
        await redis.del(s.redis_session_key);
      }
    }
    await db
      .update(sessions)
      .set({ is_active: false })
      .where(and(eq(sessions.user_id, user_id), ne(sessions.redis_session_key, `session:${currentSessionId}`)));
  }
}

export const userAuthService = new UserAuthService();
