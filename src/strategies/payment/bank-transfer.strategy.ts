import type { PaymentStrategy, PaymentRequest, PaymentResult } from "./payment.strategy";

export class BankTransferPaymentStrategy implements PaymentStrategy {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Bank transfer requires manual verification by admin
    // In production, integrate with bank API for auto-verification
    if (!request.transactionId) {
      return { success: false, error: "Transaction ID required for bank transfer" };
    }

    return {
      success: true,
      transactionId: request.transactionId,
    };
  }

  async processRefund(_transactionId: string, _amount: number): Promise<PaymentResult> {
    // Refunds would require bank API integration
    return {
      success: true,
      transactionId: `REFUND-BT-${Date.now()}`,
    };
  }

  async validatePayment(transactionId: string): Promise<boolean> {
    // In production, verify with bank API
    return !!transactionId;
  }
}
