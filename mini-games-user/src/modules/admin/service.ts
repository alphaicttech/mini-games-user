import { and, count, desc, eq, ilike, sql, sum } from 'drizzle-orm';
import { db } from '../../db';
import {
  admins,
  appSettings,
  auditLogs,
  deposits,
  gameSessions,
  games,
  users,
  walletTransactions,
  wallets
} from '../../db/schema/index';
import { hashPassword } from '../../utils/password';
import { walletService } from '../wallets/service';
import { writeAuditLog } from '../../utils/audit';
import { depositsService } from '../deposits/service';

export class AdminService {
  async dashboardSummary() {
    const [totalUsers] = await db.select({ c: count() }).from(users);
    const [activeUsers] = await db.select({ c: count() }).from(users).where(eq(users.status, 'ACTIVE'));
    const [blockedUsers] = await db.select({ c: count() }).from(users).where(eq(users.status, 'BLOCKED'));
    const [totalBalance] = await db.select({ v: sum(wallets.balance) }).from(wallets);
    const [totalDeposits] = await db.select({ c: count() }).from(deposits);
    const [verifiedDeposits] = await db.select({ c: count() }).from(deposits).where(eq(deposits.status, 'VERIFIED'));
    const [failedDeposits] = await db.select({ c: count() }).from(deposits).where(eq(deposits.status, 'FAILED'));
    const [betVolume] = await db.select({ v: sum(walletTransactions.amount) }).from(walletTransactions).where(eq(walletTransactions.type, 'BET'));
    const [winVolume] = await db.select({ v: sum(walletTransactions.amount) }).from(walletTransactions).where(eq(walletTransactions.type, 'WIN'));

    return {
      total_users: totalUsers.c,
      active_users: activeUsers.c,
      blocked_users: blockedUsers.c,
      total_balance: totalBalance.v ?? '0',
      total_deposits: totalDeposits.c,
      verified_deposits: verifiedDeposits.c,
      failed_deposits: failedDeposits.c,
      total_bet_volume: betVolume.v ?? '0',
      total_win_volume: winVolume.v ?? '0'
    };
  }

  listUsers(search?: string) {
    if (search) return db.select().from(users).where(ilike(users.username, `%${search}%`));
    return db.select().from(users);
  }

  getUser(id: string) {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async updateUserStatus(id: string, status: 'ACTIVE' | 'BLOCKED') {
    const [row] = await db.update(users).set({ status, updated_at: new Date() }).where(eq(users.id, id)).returning();
    return row;
  }

  async adjustUserBalance(input: { user_id: string; amount: string; direction: 'CREDIT' | 'DEBIT'; admin_id: string; reason: string }) {
    const tx = await walletService.mutateBalance({
      user_id: input.user_id,
      amount: input.amount,
      type: 'ADJUSTMENT',
      direction: input.direction,
      description: input.reason,
      created_by_admin_id: input.admin_id,
      allow_negative: false
    });
    await writeAuditLog({
      actor_type: 'ADMIN',
      actor_id: input.admin_id,
      action: 'adjust_user_balance',
      entity_type: 'wallet_transactions',
      entity_id: tx.transaction.id,
      metadata: { user_id: input.user_id, amount: input.amount, direction: input.direction, reason: input.reason }
    });
    return tx;
  }

  listDeposits() {
    return db.select().from(deposits).orderBy(desc(deposits.created_at));
  }

  getDeposit(id: string) {
    return db.query.deposits.findFirst({ where: eq(deposits.id, id) });
  }

  async verifyDeposit(id: string) {
    const dep = await this.getDeposit(id);
    if (!dep) throw new Error('Deposit not found');
    return depositsService.verify(dep.user_id, dep.id, dep.raw_payload ?? undefined);
  }

  async listTransactions() {
    return db.select().from(walletTransactions).orderBy(desc(walletTransactions.created_at));
  }

  getTransaction(id: string) {
    return db.query.walletTransactions.findFirst({ where: eq(walletTransactions.id, id) });
  }

  async refundTransaction(id: string, admin_id: string) {
    const tx = await this.getTransaction(id);
    if (!tx) throw new Error('Transaction not found');
    if (tx.direction !== 'DEBIT') throw new Error('Only debit tx can be refunded');
    return walletService.mutateBalance({
      user_id: tx.user_id,
      amount: tx.amount,
      type: 'REFUND',
      direction: 'CREDIT',
      reference_type: 'wallet_transaction',
      reference_id: tx.id,
      created_by_admin_id: admin_id,
      description: 'Admin refund'
    });
  }

  listGames() {
    return db.select().from(games).orderBy(desc(games.created_at));
  }

  getGame(id: string) {
    return db.query.games.findFirst({ where: eq(games.id, id) });
  }

  async createGame(input: { code: string; name: string; slug: string; description?: string; config?: Record<string, unknown> }) {
    const [row] = await db.insert(games).values(input).returning();
    return row;
  }

  async updateGame(id: string, input: Partial<{ name: string; description: string; is_active: boolean; config: Record<string, unknown> }>) {
    const [row] = await db.update(games).set({ ...input, updated_at: new Date() }).where(eq(games.id, id)).returning();
    return row;
  }

  listGameSessions() {
    return db.select().from(gameSessions).orderBy(desc(gameSessions.created_at));
  }

  getGameSession(id: string) {
    return db.query.gameSessions.findFirst({ where: eq(gameSessions.id, id) });
  }

  listAuditLogs() {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.created_at));
  }

  listSettings() {
    return db.select().from(appSettings);
  }

  async updateSetting(key: string, value: Record<string, unknown>, admin_id: string) {
    const existing = await db.query.appSettings.findFirst({ where: eq(appSettings.key, key) });
    if (!existing) {
      const [created] = await db.insert(appSettings).values({ key, value, updated_by_admin_id: admin_id }).returning();
      return created;
    }
    const [updated] = await db
      .update(appSettings)
      .set({ value, updated_by_admin_id: admin_id, updated_at: new Date() })
      .where(eq(appSettings.id, existing.id))
      .returning();
    return updated;
  }

  listAdmins() {
    return db.select().from(admins).orderBy(desc(admins.created_at));
  }

  getAdmin(id: string) {
    return db.query.admins.findFirst({ where: eq(admins.id, id) });
  }

  async createAdmin(input: { username: string; password: string; full_name: string; role: string }) {
    const [row] = await db
      .insert(admins)
      .values({ username: input.username, password_hash: await hashPassword(input.password), full_name: input.full_name, role: input.role })
      .returning();
    return row;
  }

  async updateAdmin(id: string, input: Partial<{ full_name: string; role: string; status: 'ACTIVE' | 'BLOCKED' }>) {
    const [row] = await db.update(admins).set({ ...input, updated_at: new Date() }).where(eq(admins.id, id)).returning();
    return row;
  }

  async updateAdminPassword(id: string, password: string) {
    const [row] = await db.update(admins).set({ password_hash: await hashPassword(password), updated_at: new Date() }).where(eq(admins.id, id)).returning();
    return row;
  }
}

export const adminService = new AdminService();
