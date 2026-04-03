import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { deposits } from '../../db/schema/index';
import { env } from '../../env';
import { TelebirrVerifierAdapter } from '../../integrations/payment/telebirr.adapter';
import { walletService } from '../wallets/service';
import { withIdempotency } from '../../utils/idempotency';

const verifier = new TelebirrVerifierAdapter();

export class DepositsService {
  async create(user_id: string, amount: string, payment_reference: string) {
    const [row] = await db
      .insert(deposits)
      .values({ user_id, amount, currency: env.DEFAULT_CURRENCY, payment_reference, method: 'TELEBIRR' })
      .returning();
    return row;
  }

  async verify(user_id: string, deposit_id: string, payload?: Record<string, unknown>) {
    return withIdempotency(`deposit:verify:${deposit_id}`, 120, async () => {
      return db.transaction(async (tx) => {
        const record = await tx.query.deposits.findFirst({ where: and(eq(deposits.id, deposit_id), eq(deposits.user_id, user_id)) });
        if (!record) throw new Error('Deposit not found');
        if (record.status === 'VERIFIED') return record;

        const verified = await verifier.verifyPayment(record.payment_reference, payload);
        if (!verified.success) {
          const [failed] = await tx
            .update(deposits)
            .set({ status: 'FAILED', raw_payload: verified.raw_payload ?? payload, updated_at: new Date() })
            .where(eq(deposits.id, deposit_id))
            .returning();
          return failed;
        }

        const [success] = await tx
          .update(deposits)
          .set({
            status: 'VERIFIED',
            external_reference: verified.external_reference,
            verifier_source: 'telebirr_adapter',
            raw_payload: verified.raw_payload ?? payload,
            verified_at: new Date(),
            updated_at: new Date()
          })
          .where(eq(deposits.id, deposit_id))
          .returning();

        await walletService.mutateBalance({
          user_id,
          amount: record.amount,
          type: 'DEPOSIT',
          direction: 'CREDIT',
          reference_type: 'deposit',
          reference_id: success.id,
          description: 'Deposit verified'
        });

        return success;
      });
    });
  }

  listByUser(user_id: string, limit = 20, offset = 0) {
    return db.query.deposits.findMany({ where: eq(deposits.user_id, user_id), orderBy: [desc(deposits.created_at)], limit, offset });
  }

  getById(user_id: string, id: string) {
    return db.query.deposits.findFirst({ where: and(eq(deposits.id, id), eq(deposits.user_id, user_id)) });
  }
}

export const depositsService = new DepositsService();
