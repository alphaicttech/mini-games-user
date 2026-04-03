import { z } from 'zod';

export const getUploadSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({ companyId: z.string().uuid().optional() })
});
