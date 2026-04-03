import { z } from 'zod';

export const adminLoginSchema = z.object({
  body: z.object({ username: z.string().min(3), password: z.string().min(8) }),
  params: z.object({}),
  query: z.object({})
});
