import { z } from 'zod';

export const superAdminCreateDepositSchema = z.object({
  body: z.object({
    companyId: z.string().uuid(),
    externalReference: z.string().min(1).max(100),
    externalUserId: z.string().max(100).optional(),
    expectedAmount: z.number().positive().optional(),
    returnUrlSuccess: z.string().url().optional(),
    returnUrlFail: z.string().url().optional(),
    metadata: z.record(z.any()).optional()
  })
});

export const superAdminCreditCompanySchema = z.object({
  params: z.object({
    companyId: z.string().uuid()
  }),
  body: z.object({
    amount: z.number().positive(),
    reason: z.string().max(500).optional()
  })
});
