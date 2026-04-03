import { z } from 'zod';

export const createWithdrawalSchema = z.object({
  body: z.object({
    externalReference: z.string().min(1).max(100),
    amount: z.number().positive(),
    currency: z.string().min(3).max(10).default('ETB'),
    metadata: z.record(z.any()).optional()
  })
});

export const listWithdrawalsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().optional(),
    status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED']).optional(),
    companyId: z.string().uuid().optional()
  })
});

export const getWithdrawalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({ companyId: z.string().uuid().optional() })
});

export const approveWithdrawalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    proofUploadedFileId: z.string().uuid(),
    adminNote: z.string().max(1000).optional(),
    companyId: z.string().uuid().optional()
  })
});

export const rejectWithdrawalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    reason: z.string().min(3).max(1000),
    companyId: z.string().uuid().optional()
  })
});
