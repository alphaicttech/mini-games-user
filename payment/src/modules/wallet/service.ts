import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { companies, walletAccounts, walletLedger } from '../../db/schema';
import { AppError } from '../../lib/errors';

export const walletService = {
  async creditCompanyBalance(input: { companyId: string; amount: number; reason?: string; actorUserId?: string }): Promise<{ credited: number; beforeBalance: number; afterBalance: number }> {
    return db.transaction(async (trx) => {
      const wallet = await trx.query.walletAccounts.findFirst({
        where: and(eq(walletAccounts.companyId, input.companyId), eq(walletAccounts.currency, 'ETB'))
      });
      if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet missing');

      const before = Number(wallet.availableBalance);
      const after = before + input.amount;
      await trx.update(walletAccounts).set({ availableBalance: String(after) }).where(eq(walletAccounts.id, wallet.id));
      await trx.update(companies).set({ balanceAvailable: String(after) }).where(eq(companies.id, input.companyId));
      await trx.insert(walletLedger).values({
        walletAccountId: wallet.id,
        companyId: input.companyId,
        entryType: 'SUPER_ADMIN_CREDIT',
        amount: String(input.amount),
        beforeBalance: String(before),
        afterBalance: String(after),
        referenceType: 'super_admin_charge',
        meta: {
          reason: input.reason || null,
          actorUserId: input.actorUserId || null
        }
      });

      return { credited: input.amount, beforeBalance: before, afterBalance: after };
    });
  },

  async deductFee(companyId: string, amount: number, referenceId: string): Promise<void> {
    await db.transaction(async (trx) => {
      const wallet = await trx.query.walletAccounts.findFirst({
        where: and(eq(walletAccounts.companyId, companyId), eq(walletAccounts.currency, 'ETB'))
      });
      if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet missing');

      const before = Number(wallet.availableBalance);
      const allowed = wallet.overdraftAllowed ? before + Number(wallet.overdraftLimit) : before;
      if (allowed < amount) throw new AppError(409, 'INSUFFICIENT_BALANCE', 'Insufficient company balance');

      const after = before - amount;
      await trx.update(walletAccounts).set({ availableBalance: String(after) }).where(eq(walletAccounts.id, wallet.id));
      await trx.update(companies).set({ balanceAvailable: String(after) }).where(eq(companies.id, companyId));
      await trx.insert(walletLedger).values({
        walletAccountId: wallet.id,
        companyId,
        entryType: 'AUTO_FEE_DEDUCTION',
        amount: String(amount),
        beforeBalance: String(before),
        afterBalance: String(after),
        referenceType: 'deposit_session',
        referenceId
      });
    });
  },

  async reserveForWithdrawal(input: { companyId: string; amount: number; withdrawalRequestId: string; actorUserId?: string }): Promise<{ beforeBalance: number; afterBalance: number }> {
    return db.transaction(async (trx) => {
      const wallet = await trx.query.walletAccounts.findFirst({
        where: and(eq(walletAccounts.companyId, input.companyId), eq(walletAccounts.currency, 'ETB'))
      });
      if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet missing');

      const before = Number(wallet.availableBalance);
      if (before < input.amount) throw new AppError(409, 'INSUFFICIENT_BALANCE', 'Insufficient company balance');

      const after = before - input.amount;
      await trx.update(walletAccounts).set({ availableBalance: String(after) }).where(eq(walletAccounts.id, wallet.id));
      await trx.update(companies).set({ balanceAvailable: String(after) }).where(eq(companies.id, input.companyId));
      await trx.insert(walletLedger).values({
        walletAccountId: wallet.id,
        companyId: input.companyId,
        entryType: 'WITHDRAWAL_REQUEST',
        amount: String(input.amount),
        beforeBalance: String(before),
        afterBalance: String(after),
        referenceType: 'withdrawal_request',
        referenceId: input.withdrawalRequestId,
        meta: {
          actorUserId: input.actorUserId || null
        }
      });

      return { beforeBalance: before, afterBalance: after };
    });
  },

  async refundWithdrawal(input: { companyId: string; amount: number; withdrawalRequestId: string; actorUserId?: string; reason?: string }): Promise<{ beforeBalance: number; afterBalance: number }> {
    return db.transaction(async (trx) => {
      const wallet = await trx.query.walletAccounts.findFirst({
        where: and(eq(walletAccounts.companyId, input.companyId), eq(walletAccounts.currency, 'ETB'))
      });
      if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet missing');

      const before = Number(wallet.availableBalance);
      const after = before + input.amount;
      await trx.update(walletAccounts).set({ availableBalance: String(after) }).where(eq(walletAccounts.id, wallet.id));
      await trx.update(companies).set({ balanceAvailable: String(after) }).where(eq(companies.id, input.companyId));
      await trx.insert(walletLedger).values({
        walletAccountId: wallet.id,
        companyId: input.companyId,
        entryType: 'WITHDRAWAL_REFUND',
        amount: String(input.amount),
        beforeBalance: String(before),
        afterBalance: String(after),
        referenceType: 'withdrawal_request',
        referenceId: input.withdrawalRequestId,
        meta: {
          actorUserId: input.actorUserId || null,
          reason: input.reason || null
        }
      });

      return { beforeBalance: before, afterBalance: after };
    });
  }
};
