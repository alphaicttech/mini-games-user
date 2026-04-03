import { and, eq, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { comparePassword } from '../../../utils/password';
import { db } from '../../../db';
import { admins, sessions } from '../../../db/schema/index';
import { redis } from '../../../config/redis';
import { env } from '../../../env';

export class AdminAuthService {
  async login(username: string, password: string, metadata: { ip?: string; user_agent?: string }) {
    const admin = await db.query.admins.findFirst({ where: and(eq(admins.username, username), eq(admins.status, 'ACTIVE')) });
    if (!admin) throw new Error('Invalid credentials');
    const ok = await comparePassword(password, admin.password_hash);
    if (!ok) throw new Error('Invalid credentials');

    const session_id = nanoid(32);
    const redisKey = `session:${session_id}`;
    const expires_at = new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);

    await db.insert(sessions).values({
      admin_id: admin.id,
      role: admin.role === 'SUPER_ADMIN' ? 'super_admin' : 'admin',
      redis_session_key: redisKey,
      ip: metadata.ip,
      user_agent: metadata.user_agent,
      expires_at
    });

    await redis.set(redisKey, JSON.stringify({ admin_id: admin.id, role: admin.role }), 'EX', env.SESSION_TTL_SECONDS);

    return { session_id, admin: { id: admin.id, username: admin.username, role: admin.role, full_name: admin.full_name } };
  }

  async logout(session_id: string) {
    await redis.del(`session:${session_id}`);
    await db.update(sessions).set({ is_active: false }).where(eq(sessions.redis_session_key, `session:${session_id}`));
  }

  mySessions(admin_id: string) {
    return db.query.sessions.findMany({ where: and(eq(sessions.admin_id, admin_id), eq(sessions.is_active, true)) });
  }

  async logoutOtherSessions(admin_id: string, currentSessionId: string) {
    const list = await this.mySessions(admin_id);
    for (const s of list) {
      if (s.redis_session_key !== `session:${currentSessionId}`) await redis.del(s.redis_session_key);
    }
    await db
      .update(sessions)
      .set({ is_active: false })
      .where(and(eq(sessions.admin_id, admin_id), ne(sessions.redis_session_key, `session:${currentSessionId}`)));
  }
}

export const adminAuthService = new AdminAuthService();
