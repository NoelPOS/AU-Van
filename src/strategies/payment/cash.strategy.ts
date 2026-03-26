import type { PaymentStrategy, PaymentRequest, PaymentResult } from "./payment.strategy";

export class CashPaymentStrategy implements PaymentStrategy {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Cash payments are confirmed on pickup — auto-approve
    return {
      success: true,
      transactionId: `CASH-${Date.now()}-${request.bookingId.slice(-6)}`,
    };
  }

  async processRefund(_transactionId: string, _amount: number): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `REFUND-CASH-${Date.now()}`,
    };
  }

  async validatePayment(_transactionId: string): Promise<boolean> {
    return true; // Cash is always "valid" — collected in person
  }
}
