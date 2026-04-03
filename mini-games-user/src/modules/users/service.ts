import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema/index';

export class UsersService {
  getMe(user_id: string) {
    return db.query.users.findFirst({ where: eq(users.id, user_id) });
  }

  async updateMe(user_id: string, data: { display_name?: string; language_code?: string }) {
    const [updated] = await db.update(users).set({ ...data, updated_at: new Date() }).where(eq(users.id, user_id)).returning();
    return updated;
  }
}

export const usersService = new UsersService();
