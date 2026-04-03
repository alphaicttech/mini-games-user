import crypto from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { db } from '../../db';
import { webhookDeliveries, webhookEvents } from '../../db/schema';
import { redis } from '../../redis';
import { env } from '../../env';
import { AppError } from '../../lib/errors';

const webhookQueue = new Queue('webhook-delivery', { connection: redis });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const webhookService = {
  async list(companyId: string, input: { page: number; pageSize: number; offset: number }) {
    const whereClause = eq(webhookEvents.companyId, companyId);
    const items = await db.query.webhookEvents.findMany({
      where: whereClause,
      orderBy: [desc(webhookEvents.createdAt), desc(webhookEvents.id)],
      limit: input.pageSize,
      offset: input.offset
    });

    const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(webhookEvents).where(whereClause);
    const totalCount = countRows[0]?.count ?? 0;

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / input.pageSize)
    };
  },

  async byId(companyId: string, id: string) {
    if (!UUID_RE.test(id)) throw new AppError(404, 'NOT_FOUND', 'Webhook event not found');
    const event = await db.query.webhookEvents.findFirst({
      where: and(eq(webhookEvents.id, id), eq(webhookEvents.companyId, companyId))
    });
    if (!event) throw new AppError(404, 'NOT_FOUND', 'Webhook event not found');
    return event;
  },

  async deliveries(companyId: string, webhookEventId: string) {
    await this.byId(companyId, webhookEventId);
    return db.query.webhookDeliveries.findMany({
      where: eq(webhookDeliveries.webhookEventId, webhookEventId),
      orderBy: desc(webhookDeliveries.createdAt)
    });
  },

  async enqueueDepositEvent(input: { companyId: string; depositSessionId: string; eventType: 'deposit.success' | 'deposit.failed' | 'deposit.manual_review' | 'deposit.expired'; payload: Record<string, unknown> }) {
    const idempotencyKey = crypto.createHash('sha256').update(`${input.companyId}:${input.depositSessionId}:${input.eventType}`).digest('hex');
    const [event] = await db.insert(webhookEvents).values({
      companyId: input.companyId,
      depositSessionId: input.depositSessionId,
      eventType: input.eventType,
      payload: input.payload,
      idempotencyKey
    }).returning();

    await webhookQueue.add('deliver', { eventId: event.id }, {
      attempts: 8,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true
    });

    return event;
  },

  async enqueueWithdrawalApprovedEvent(input: { companyId: string; withdrawalRequestId: string; payload: Record<string, unknown> }) {
    const idempotencyKey = crypto.createHash('sha256').update(`${input.companyId}:${input.withdrawalRequestId}:withdrawal.approved`).digest('hex');
    const [event] = await db.insert(webhookEvents).values({
      companyId: input.companyId,
      withdrawalRequestId: input.withdrawalRequestId,
      eventType: 'withdrawal.approved',
      payload: input.payload,
      idempotencyKey
    }).returning();

    await webhookQueue.add('deliver', { eventId: event.id }, {
      attempts: 8,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true
    });

    return event;
  },

  signPayload(payload: string, timestamp: string): string {
    return crypto.createHmac('sha256', env.WEBHOOK_SIGNING_SECRET).update(`${timestamp}.${payload}`).digest('hex');
  }
};
