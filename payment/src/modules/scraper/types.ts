export type TelebirrReceipt = {
  merchant: { name: string; tin_no?: string };
  transaction: {
    payer_name: string;
    payer_telebirr_no: string;
    credited_party_name: string;
    credited_party_account_no: string;
    transaction_status: string;
  };
  invoice: { invoice_no: string; payment_date: string; settled_amount: string };
  summary: { payment_mode?: string };
};

export interface TelebirrParserClient {
  verifyByTxId(txId: string): Promise<TelebirrReceipt>;
}
