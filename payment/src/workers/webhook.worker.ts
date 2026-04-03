import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { companies, webhookDeliveries, webhookEvents } from '../db/schema';
import { redis } from '../redis';
import { webhookService } from '../modules/webhook/service';

async function postJson(url: string, payload: string, headers: Record<string, string>): Promise<{ status: number; body: string }> {
  const resp = await fetch(url, { method: 'POST', headers, body: payload });
  return { status: resp.status, body: await resp.text() };
}

new Worker(
  'webhook-delivery',
  async (job) => {
    const event = await db.query.webhookEvents.findFirst({ where: eq(webhookEvents.id, job.data.eventId) });
    if (!event) throw new Error('webhook event not found');

    const company = await db.query.companies.findFirst({ where: eq(companies.id, event.companyId) });
    if (!company?.webhookUrl) throw new Error('company webhook url not set');

    const payload = JSON.stringify(event.payload);
    const ts = new Date().toISOString();
    const signature = webhookService.signPayload(payload, ts);
    const headers = {
      'content-type': 'application/json',
      'x-webhook-signature': signature,
      'x-webhook-timestamp': ts,
      'x-idempotency-key': event.idempotencyKey
    };

    const result = await postJson(company.webhookUrl, payload, headers);
    await db.insert(webhookDeliveries).values({
      webhookEventId: event.id,
      attemptNo: job.attemptsMade + 1,
      requestHeaders: headers,
      requestBody: event.payload,
      responseStatus: result.status,
      responseBody: result.body
    });

    await db.update(webhookEvents).set({ status: result.status >= 200 && result.status < 300 ? 'SENT' : 'FAILED' }).where(eq(webhookEvents.id, event.id));

    if (result.status >= 300) throw new Error(`Webhook non-2xx status: ${result.status}`);
  },
  { connection: redis }
);
