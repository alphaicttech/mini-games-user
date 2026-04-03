import { z } from 'zod';

export const telegramLoginSchema = z.object({
  body: z.object({
    id: z.string(),
    username: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    photo_url: z.string().optional(),
    auth_date: z.string(),
    hash: z.string()
  }),
  params: z.object({}),
  query: z.object({})
});
