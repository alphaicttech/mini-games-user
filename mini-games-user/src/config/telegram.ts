import { env } from '../env';

export const telegramConfig = {
  botToken: env.TELEGRAM_BOT_TOKEN,
  maxLoginAgeSeconds: env.TELEGRAM_LOGIN_MAX_AGE_SECONDS
};
