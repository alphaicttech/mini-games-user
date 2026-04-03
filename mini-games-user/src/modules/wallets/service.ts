import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { wallets, walletTransactions } from '../../db/schema/index';
import { addMoney, ltMoney, subMoney } from '../../utils/money';

export class WalletService {
  async getOrCreateWallet(user_id: string, currency: string) {
    const existing = await db.query.wallets.findFirst({ where: eq(wallets.user_id, user_id) });
    if (existing) return existing;
    const [created] = await db.insert(wallets).values({ user_id, currency }).returning();
    return created;
  }

  async getWallet(user_id: string) {
    return db.query.wallets.findFirst({ where: eq(wallets.user_id, user_id) });
  }

  async listTransactions(user_id: string, limit = 20, offset = 0) {
    return db.query.walletTransactions.findMany({
      where: eq(walletTransactions.user_id, user_id),
      orderBy: [desc(walletTransactions.created_at)],
      limit,
      offset
    });
  }

  async mutateBalance(input: {
    user_id: string;
    amount: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN' | 'REFUND' | 'BONUS' | 'ADJUSTMENT' | 'REVERSAL';
    direction: 'CREDIT' | 'DEBIT';
    reference_type?: string;
    reference_id?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    created_by_admin_id?: string;
    allow_negative?: boolean;
  }) {
    return db.transaction(async (tx) => {
      const wallet = await tx.query.wallets.findFirst({ where: eq(wallets.user_id, input.user_id) });
      if (!wallet) throw new Error('Wallet not found');
      const balanceBefore = wallet.balance;
      const balanceAfter = input.direction === 'CREDIT' ? addMoney(balanceBefore, input.amount) : subMoney(balanceBefore, input.amount);

      if (input.direction === 'DEBIT' && !input.allow_negative && ltMoney(balanceBefore, input.amount)) {
        throw new Error('Insufficient balance');
      }

      await tx.update(wallets).set({ balance: balanceAfter, updated_at: new Date() }).where(eq(wallets.id, wallet.id));
      const [ledger] = await tx
        .insert(walletTransactions)
        .values({
          user_id: input.user_id,
          wallet_id: wallet.id,
          type: input.type,
          direction: input.direction,
          amount: input.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference_type: input.reference_type,
          reference_id: input.reference_id,
          description: input.description,
          metadata: input.metadata,
          created_by_admin_id: input.created_by_admin_id
        })
        .returning();

      return { wallet_id: wallet.id, balance_before: balanceBefore, balance_after: balanceAfter, transaction: ledger };
    });
  }
}

export const walletService = new WalletService();
