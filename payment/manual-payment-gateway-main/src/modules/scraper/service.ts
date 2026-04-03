import { env } from '../../env';
import { redis } from '../../redis';
import { TelebirrParserClient, TelebirrReceipt } from './types';

class InMemoryMockParserClient implements TelebirrParserClient {
  async verifyByTxId(txId: string): Promise<TelebirrReceipt> {
    return {
      merchant: { name: 'Ethio telecom', tin_no: '0000030603' },
      transaction: {
        payer_name: 'demo payer',
        payer_telebirr_no: '2519***5234',
        credited_party_name: 'Shemeles Kumessa Moreda',
        credited_party_account_no: '2519***1118',
        transaction_status: 'Completed'
      },
      invoice: { invoice_no: `INV-${txId}`, payment_date: '30-03-2026 11:19:48', settled_amount: '2000.00 Birr' },
      summary: { payment_mode: 'telebirr' }
    };
  }
}

export class RateLimitedTelebirrService {
  constructor(private readonly client: TelebirrParserClient) {}

  async verify(txId: string, companyId: string): Promise<TelebirrReceipt> {
    const bucket = `telebirr_rate:${companyId}:${Math.floor(Date.now() / 60000)}`;
    const count = await redis.incr(bucket);
    if (count === 1) await redis.expire(bucket, 70);
    if (count > env.TELEBIRR_VERIFY_RATE_LIMIT_PER_MIN) {
      throw new Error('Telebirr verification rate limit exceeded');
    }

    return this.client.verifyByTxId(txId);
  }
}

export const telebirrService = new RateLimitedTelebirrService(new InMemoryMockParserClient());
