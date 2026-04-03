import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { companyUsers } from '../../db/schema';

export const authRepository = {
  async findByEmail(email: string) {
    return db.query.companyUsers.findFirst({ where: eq(companyUsers.email, email) });
  },
  async findById(id: string) {
    return db.query.companyUsers.findFirst({ where: eq(companyUsers.id, id) });
  }
};
