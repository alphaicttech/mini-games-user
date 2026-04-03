import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default('mini-games-user'),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SESSION_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 7),
  SESSION_COOKIE_NAME: z.string().default('mg_session'),
  SESSION_COOKIE_SECURE: z.coerce.boolean().default(false),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_LOGIN_MAX_AGE_SECONDS: z.coerce.number().default(300),
  ADMIN_DEFAULT_USERNAME: z.string().default('superadmin'),
  ADMIN_DEFAULT_PASSWORD: z.string().default('change_me'),
  DEFAULT_CURRENCY: z.string().default('ETB'),
  LOG_LEVEL: z.string().default('info')
});

export const env = envSchema.parse(process.env);
