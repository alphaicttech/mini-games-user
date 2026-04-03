import { z } from 'zod';

export const createDepositSchema = z.object({
  body: z.object({
    companySlug: z.string().min(2),
    externalReference: z.string().min(1).max(100),
    externalUserId: z.string().max(100).optional(),
    expectedAmount: z.number().positive().optional(),
    returnUrlSuccess: z.string().url().optional(),
    returnUrlFail: z.string().url().optional(),
    metadata: z.record(z.any()).optional()
  })
});

export const submitDepositSchema = z.object({
  body: z.object({ txId: z.string().min(4), uploadedFileId: z.string().uuid().optional() }),
  params: z.object({ id: z.string().uuid() })
});
