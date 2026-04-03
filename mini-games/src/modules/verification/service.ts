import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { depositSessions, receivingNumbers, verifiedTransactions } from '../../db/schema';
import { compareLastDigits, compareNames } from '../../utils/match';
import { parseBirrAmount } from '../../utils/money';
import { telebirrService } from '../scraper/service';
import { walletService } from '../wallet/service';

export const verificationService = {
  async process(depositSessionId: string, txId: string): Promise<{ decision: string; reasons: string[] }> {
    const session = await db.query.depositSessions.findFirst({ where: eq(depositSessions.id, depositSessionId) });
    if (!session) throw new Error('Deposit session not found');
    const number = await db.query.receivingNumbers.findFirst({
      where: and(eq(receivingNumbers.id, session.assignedReceivingNumberId || ''), eq(receivingNumbers.companyId, session.companyId))
    });
    if (!number) throw new Error('Assigned receiving number not found');

    const duplicate = await db.query.verifiedTransactions.findFirst({ where: eq(verifiedTransactions.txId, txId) });
    if (duplicate) {
      return { decision: 'FAILED', reasons: ['TX_ID_ALREADY_USED'] };
    }

    const receipt = await telebirrService.verify(txId, session.companyId);
    const reasons: string[] = [];

    if (receipt.transaction.transaction_status.toLowerCase() !== 'completed') reasons.push('TRANSACTION_NOT_COMPLETED');
    if (!compareLastDigits(number.phoneNumber, receipt.transaction.credited_party_account_no, 4)) reasons.push('RECEIVER_LAST_DIGITS_MISMATCH');
    if (!compareNames(number.accountHolderName, receipt.transaction.credited_party_name, 0.7)) reasons.push('RECEIVER_NAME_MISMATCH');
    if ((receipt.summary.payment_mode || '').toLowerCase() !== 'telebirr') reasons.push('PAYMENT_MODE_INVALID');

    if (session.expectedAmount) {
      const settled = parseBirrAmount(receipt.invoice.settled_amount);
      const expected = Number(session.expectedAmount);
      if (Math.abs(settled - expected) > 0.01) reasons.push('AMOUNT_MISMATCH');
    }

    const decision = reasons.length ? 'FAILED' : 'SUCCESS';

    await db.transaction(async (trx) => {
      await trx.insert(verifiedTransactions).values({
        companyId: session.companyId,
        depositSessionId,
        txId,
        invoiceNo: receipt.invoice.invoice_no,
        amountSettled: String(parseBirrAmount(receipt.invoice.settled_amount)),
        rawPayload: receipt,
        normalizedPayload: receipt,
        decision,
        reasons,
        riskFlags: decision === 'FAILED' ? ['AUTO_FAILED'] : []
      });
      await trx.update(depositSessions).set({ status: decision === 'SUCCESS' ? 'WEBHOOK_PENDING' : 'FAILED' }).where(eq(depositSessions.id, depositSessionId));
    });

    if (decision === 'SUCCESS') {
      const amount = session.expectedAmount ? Number(session.expectedAmount) : parseBirrAmount(receipt.invoice.settled_amount);
      const fee = amount * 0.03;
      await walletService.deductFee(session.companyId, fee, depositSessionId);
    }

    return { decision, reasons };
  }
};
