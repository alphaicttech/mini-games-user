import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { uploadedFiles, withdrawalRequests } from '../../db/schema';
import { AppError } from '../../lib/errors';
import { webhookService } from '../webhook/service';
import { walletService } from '../wallet/service';

export const withdrawalService = {
  async list(companyId: string, input: { page: number; pageSize: number; offset: number; status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' }) {
    const whereClause = input.status
      ? and(eq(withdrawalRequests.companyId, companyId), eq(withdrawalRequests.status, input.status))
      : eq(withdrawalRequests.companyId, companyId);

    const items = await db.query.withdrawalRequests.findMany({
      where: whereClause,
      orderBy: [desc(withdrawalRequests.createdAt), desc(withdrawalRequests.id)],
      limit: input.pageSize,
      offset: input.offset
    });

    const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(withdrawalRequests).where(whereClause);
    const totalCount = countRows[0]?.count ?? 0;

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / input.pageSize)
    };
  },

  async byId(companyId: string, id: string) {
    const row = await db.query.withdrawalRequests.findFirst({
      where: and(eq(withdrawalRequests.companyId, companyId), eq(withdrawalRequests.id, id))
    });
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Withdrawal request not found');

    const proofFile = row.proofUploadedFileId
      ? await db.query.uploadedFiles.findFirst({
          where: and(eq(uploadedFiles.id, row.proofUploadedFileId), eq(uploadedFiles.companyId, companyId))
        })
      : null;

    return {
      ...row,
      proofFile: proofFile
        ? {
            id: proofFile.id,
            originalName: proofFile.originalName,
            mimeType: proofFile.mimeType,
            byteSize: proofFile.byteSize,
            downloadPath: `/api/uploads/${proofFile.id}/download`
          }
        : null
    };
  },

  async create(input: {
    companyId: string;
    externalReference: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, unknown>;
    requestedByUserId?: string;
  }) {
    const [created] = await db
      .insert(withdrawalRequests)
      .values({
        companyId: input.companyId,
        externalReference: input.externalReference,
        amount: String(input.amount),
        currency: input.currency || 'ETB',
        metadata: input.metadata || {},
        requestedByUserId: input.requestedByUserId
      })
      .returning();

    await walletService.reserveForWithdrawal({
      companyId: input.companyId,
      amount: input.amount,
      withdrawalRequestId: created.id,
      actorUserId: input.requestedByUserId
    });

    return created;
  },

  async approve(input: {
    companyId: string;
    withdrawalId: string;
    proofUploadedFileId: string;
    adminNote?: string;
    approvedByUserId: string;
  }) {
    const withdrawal = await db.query.withdrawalRequests.findFirst({
      where: and(eq(withdrawalRequests.companyId, input.companyId), eq(withdrawalRequests.id, input.withdrawalId))
    });
    if (!withdrawal) throw new AppError(404, 'NOT_FOUND', 'Withdrawal request not found');
    if (withdrawal.status !== 'PENDING_APPROVAL') throw new AppError(409, 'INVALID_STATE', `Cannot approve withdrawal in status ${withdrawal.status}`);

    const proof = await db.query.uploadedFiles.findFirst({
      where: and(eq(uploadedFiles.id, input.proofUploadedFileId), eq(uploadedFiles.companyId, input.companyId))
    });
    if (!proof) throw new AppError(404, 'NOT_FOUND', 'Proof screenshot not found');

    const [updated] = await db
      .update(withdrawalRequests)
      .set({
        status: 'APPROVED',
        proofUploadedFileId: input.proofUploadedFileId,
        adminNote: input.adminNote,
        approvedByUserId: input.approvedByUserId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(withdrawalRequests.companyId, input.companyId), eq(withdrawalRequests.id, input.withdrawalId)))
      .returning();

    await webhookService.enqueueWithdrawalApprovedEvent({
      companyId: input.companyId,
      withdrawalRequestId: updated.id,
      payload: {
        event: 'withdrawal.approved',
        withdrawalId: updated.id,
        externalReference: updated.externalReference,
        amount: updated.amount,
        currency: updated.currency,
        status: updated.status,
        approvedAt: updated.approvedAt,
        proofUploadedFileId: updated.proofUploadedFileId,
        adminNote: updated.adminNote
      }
    });

    return updated;
  },

  async reject(input: {
    companyId: string;
    withdrawalId: string;
    reason: string;
    rejectedByUserId: string;
  }) {
    const withdrawal = await db.query.withdrawalRequests.findFirst({
      where: and(eq(withdrawalRequests.companyId, input.companyId), eq(withdrawalRequests.id, input.withdrawalId))
    });
    if (!withdrawal) throw new AppError(404, 'NOT_FOUND', 'Withdrawal request not found');
    if (withdrawal.status !== 'PENDING_APPROVAL') throw new AppError(409, 'INVALID_STATE', `Cannot reject withdrawal in status ${withdrawal.status}`);

    await walletService.refundWithdrawal({
      companyId: input.companyId,
      amount: Number(withdrawal.amount),
      withdrawalRequestId: withdrawal.id,
      actorUserId: input.rejectedByUserId,
      reason: input.reason
    });

    const [updated] = await db
      .update(withdrawalRequests)
      .set({
        status: 'REJECTED',
        adminNote: input.reason,
        rejectedAt: new Date(),
        approvedByUserId: input.rejectedByUserId,
        updatedAt: new Date()
      })
      .where(and(eq(withdrawalRequests.companyId, input.companyId), eq(withdrawalRequests.id, input.withdrawalId)))
      .returning();

    return updated;
  }
};
