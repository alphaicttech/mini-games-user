import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { companies } from '../../db/schema';

export const companyService = {
  async list(input: { pageSize: number; offset: number; page: number }) {
    const items = await db.query.companies.findMany({
      orderBy: [desc(companies.createdAt), desc(companies.id)],
      limit: input.pageSize,
      offset: input.offset
    });

    const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(companies);

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      totalCount: countRows[0]?.count ?? 0,
      totalPages: Math.ceil((countRows[0]?.count ?? 0) / input.pageSize)
    };
  },
  byId(id: string) {
    return db.query.companies.findFirst({ where: eq(companies.id, id) });
  }
};
