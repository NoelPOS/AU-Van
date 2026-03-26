import type { PaymentStrategy, PaymentRequest, PaymentResult } from "./payment.strategy";

export class PromptPayPaymentStrategy implements PaymentStrategy {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // PromptPay — in production, integrate with PromptPay/SCB/KBank API
    if (!request.transactionId) {
      return { success: false, error: "Transaction reference required for PromptPay" };
    }

    return {
      success: true,
      transactionId: request.transactionId,
    };
  }

  async processRefund(_transactionId: string, _amount: number): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `REFUND-PP-${Date.now()}`,
    };
  }

  async validatePayment(transactionId: string): Promise<boolean> {
    // In production, verify via PromptPay API
    return !!transactionId;
  }
}
