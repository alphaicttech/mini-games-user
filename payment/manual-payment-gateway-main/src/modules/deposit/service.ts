import jwt from 'jsonwebtoken';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { companies, depositSessions, receivingNumbers } from '../../db/schema';
import { env } from '../../env';
import { sha256 } from '../../utils/hash';
import { withLock } from '../../redis/locks';
import { verificationService } from '../verification/service';
import { AppError } from '../../lib/errors';

function weightedPick<T extends { priorityWeight: number }>(items: T[]): T {
  const total = items.reduce((acc, x) => acc + Math.max(1, x.priorityWeight), 0);
  let target = Math.random() * total;
  for (const item of items) {
    target -= Math.max(1, item.priorityWeight);
    if (target <= 0) return item;
  }
  return items[0];
}

async function createDepositForCompany(
  company: typeof companies.$inferSelect,
  input: {
    externalReference: string;
    externalUserId?: string;
    expectedAmount?: number;
    returnUrlSuccess?: string;
    returnUrlFail?: string;
    metadata?: Record<string, unknown>;
  }
) {
  if (input.returnUrlSuccess && !company.allowedReturnUrls.includes(input.returnUrlSuccess)) throw new Error('return_url_success not allowed');
  if (input.returnUrlFail && !company.allowedReturnUrls.includes(input.returnUrlFail)) throw new Error('return_url_fail not allowed');

  const candidates = await db.query.receivingNumbers.findMany({
    where: and(eq(receivingNumbers.companyId, company.id), eq(receivingNumbers.status, 'ACTIVE'))
  });
  if (!candidates.length) throw new Error('No active receiving number');

  const assigned = weightedPick(candidates);
  return withLock(`number-reservation:${assigned.id}`, 5000, async () => {
    const token = jwt.sign({ c: company.id, er: input.externalReference }, env.PUBLIC_TOKEN_SECRET, { expiresIn: '30m' });
    const [created] = await db
      .insert(depositSessions)
      .values({
        companyId: company.id,
        externalReference: input.externalReference,
        externalUserId: input.externalUserId,
        expectedAmount: input.expectedAmount?.toString(),
        assignedReceivingNumberId: assigned.id,
        hostedTokenHash: sha256(token),
        status: 'WAITING_PAYMENT',
        returnUrlSuccess: input.returnUrlSuccess,
        returnUrlFail: input.returnUrlFail,
        metadata: input.metadata || {},
        expiresAt: sql`NOW() + INTERVAL '30 minutes'`
      })
      .returning();

    return { depositSession: created, hostedToken: token, receivingNumber: assigned.phoneNumber };
  });
}

export const depositService = {
  async list(companyId: string, input: { page: number; pageSize: number; offset: number; status?: string }) {
    const whereClause = input.status
      ? and(eq(depositSessions.companyId, companyId), eq(depositSessions.status, input.status as typeof depositSessions.$inferSelect.status))
      : eq(depositSessions.companyId, companyId);

    const rows = await db.query.depositSessions.findMany({
      where: whereClause,
      orderBy: [desc(depositSessions.createdAt), desc(depositSessions.id)],
      limit: input.pageSize,
      offset: input.offset
    });

    const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(depositSessions).where(whereClause);
    const totalCount = countRows[0]?.count ?? 0;

    return {
      items: rows,
      page: input.page,
      pageSize: input.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / input.pageSize)
    };
  },

  async byId(companyId: string, id: string) {
    const session = await db.query.depositSessions.findFirst({
      where: and(eq(depositSessions.companyId, companyId), eq(depositSessions.id, id))
    });
    if (!session) throw new AppError(404, 'NOT_FOUND', 'Deposit session not found');
    return session;
  },

  async create(input: {
    companySlug: string;
    externalReference: string;
    externalUserId?: string;
    expectedAmount?: number;
    returnUrlSuccess?: string;
    returnUrlFail?: string;
    metadata?: Record<string, unknown>;
  }) {
    const company = await db.query.companies.findFirst({ where: eq(companies.slug, input.companySlug) });
    if (!company) throw new Error('Company not found');
    return createDepositForCompany(company, input);
  },

  async createForCompanyId(input: {
    companyId: string;
    externalReference: string;
    externalUserId?: string;
    expectedAmount?: number;
    returnUrlSuccess?: string;
    returnUrlFail?: string;
    metadata?: Record<string, unknown>;
  }) {
    const company = await db.query.companies.findFirst({ where: eq(companies.id, input.companyId) });
    if (!company) throw new Error('Company not found');
    return createDepositForCompany(company, input);
  },

  async submit(depositSessionId: string, txId: string) {
    return verificationService.process(depositSessionId, txId);
  }
};
