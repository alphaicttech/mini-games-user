import { z } from 'zod';

export const listReceivingNumbersSchema = z.object({
  query: z.object({
    companyId: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    pageSize: z.string().regex(/^\d+$/).optional()
  })
});

export const createReceivingNumberSchema = z.object({
  body: z.object({
    companyId: z.string().uuid().optional(),
    phoneNumber: z.string().min(3).max(20),
    accountHolderName: z.string().min(2).max(160),
    label: z.string().max(120).optional(),
    priorityWeight: z.number().int().min(1).max(100).optional(),
    maxConcurrentSessions: z.number().int().min(1).max(1000).optional(),
    cooldownSeconds: z.number().int().min(0).max(86400).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']).optional()
  })
});
