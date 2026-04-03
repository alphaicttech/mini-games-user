export type VerificationResult = {
  success: boolean;
  amount?: string;
  currency?: string;
  external_reference?: string;
  raw_payload?: Record<string, unknown>;
  message?: string;
};

export interface ITelebirrVerifierAdapter {
  verifyPayment(reference: string, payload?: Record<string, unknown>): Promise<VerificationResult>;
}

export class TelebirrVerifierAdapter implements ITelebirrVerifierAdapter {
  async verifyPayment(reference: string, payload?: Record<string, unknown>): Promise<VerificationResult> {
    // TODO: wire real verifier from ../payment sibling package
    // Example: const { verifyTelebirr } = await import('../../../payment/src/verifier')
    // return verifyTelebirr(reference, payload)
    return {
      success: true,
      amount: String(payload?.amount ?? '0'),
      currency: String(payload?.currency ?? 'ETB'),
      external_reference: reference,
      raw_payload: payload,
      message: 'Stub verification success'
    };
  }
}
