import crypto from 'crypto';
import { telegramConfig } from '../config/telegram';

export type TelegramPayload = {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
  [key: string]: string | undefined;
};

export const verifyTelegramPayload = (payload: TelegramPayload): boolean => {
  const { hash, ...rest } = payload;
  const checkString = Object.keys(rest)
    .filter((k) => rest[k] !== undefined)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');

  const secret = crypto.createHash('sha256').update(telegramConfig.botToken).digest();
  const digest = crypto.createHmac('sha256', secret).update(checkString).digest('hex');

  const age = Math.floor(Date.now() / 1000) - Number(payload.auth_date);
  return digest === hash && age <= telegramConfig.maxLoginAgeSeconds;
};
