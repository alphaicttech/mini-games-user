import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { env } from '../../env';
import { UnauthorizedError } from '../../lib/errors';
import { redis } from '../../redis';
import { authRepository } from './repository';

export const authService = {
  async login(email: string, password: string, meta: { ip?: string; ua?: string }) {
    const user = await authRepository.findByEmail(email);
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const sessionId = nanoid();
    const sessionKey = `session:${sessionId}`;
    const ttlSeconds = 60 * 60 * 24;

    await redis.set(
      sessionKey,
      JSON.stringify({ userId: user.id, companyId: user.companyId, role: user.role, ip: meta.ip, ua: meta.ua }),
      'EX',
      ttlSeconds
    );

    const token = jwt.sign({ sid: sessionId }, env.SESSION_SECRET, { expiresIn: '1d' });
    return { token, user };
  },

  async logout(sessionId: string) {
    await redis.del(`session:${sessionId}`);
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');

    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    };
  }
};
