import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { receivingNumbers } from '../../db/schema';
import { AppError, ForbiddenError } from '../../lib/errors';

type CreateReceivingNumberInput = {
  actorRole: string;
  actorCompanyId: string;
  actorUserId: string;
  companyId?: string;
  phoneNumber: string;
  accountHolderName: string;
  label?: string;
  priorityWeight?: number;
  maxConcurrentSessions?: number;
  cooldownSeconds?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
};

type ListReceivingNumbersInput = {
  actorRole: string;
  actorCompanyId: string;
  companyId?: string;
  page: number;
  pageSize: number;
  offset: number;
};

export const receivingNumberService = {
  async list(input: ListReceivingNumbersInput) {
    const targetCompanyId = input.companyId ?? input.actorCompanyId;
    if (input.companyId && input.actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only super admins can list receiving numbers for another company');
    }

    const whereClause = eq(receivingNumbers.companyId, targetCompanyId);
    const items = await db.query.receivingNumbers.findMany({
      where: whereClause,
      orderBy: [desc(receivingNumbers.createdAt), desc(receivingNumbers.id)],
      limit: input.pageSize,
      offset: input.offset
    });

    const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(receivingNumbers).where(whereClause);
    const totalCount = countRows[0]?.count ?? 0;

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / input.pageSize)
    };
  },
  activate(companyId: string, id: string) {
    return db.update(receivingNumbers).set({ status: 'ACTIVE' }).where(and(eq(receivingNumbers.companyId, companyId), eq(receivingNumbers.id, id)));
  },
  async create(input: CreateReceivingNumberInput) {
    const targetCompanyId = input.companyId ?? input.actorCompanyId;
    if (!targetCompanyId) {
      throw new AppError(422, 'VALIDATION_ERROR', 'companyId is required');
    }
    if (input.companyId && input.actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only super admins can create receiving numbers for another company');
    }

    const duplicate = await db.query.receivingNumbers.findFirst({
      where: and(eq(receivingNumbers.companyId, targetCompanyId), eq(receivingNumbers.phoneNumber, input.phoneNumber))
    });
    if (duplicate) {
      throw new AppError(409, 'CONFLICT', 'Receiving number already exists for this company');
    }

    const [created] = await db.insert(receivingNumbers).values({
      companyId: targetCompanyId,
      phoneNumber: input.phoneNumber,
      accountHolderName: input.accountHolderName,
      label: input.label,
      priorityWeight: input.priorityWeight ?? 1,
      maxConcurrentSessions: input.maxConcurrentSessions ?? 5,
      cooldownSeconds: input.cooldownSeconds ?? 0,
      status: input.status ?? 'ACTIVE',
      createdBy: input.actorUserId,
      updatedBy: input.actorUserId
    }).returning();

    return created;
  }
};
