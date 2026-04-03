import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  PUBLIC_TOKEN_SECRET: z.string().min(16),
  WEBHOOK_SIGNING_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().default('*'),
  FILE_UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(5),
  TELEBIRR_VERIFY_RATE_LIMIT_PER_MIN: z.coerce.number().default(60)
});

export const env = schema.parse(process.env);
