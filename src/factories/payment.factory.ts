// Factory Pattern - Creates payment strategy instances
import type { PaymentStrategy } from "@/strategies/payment/payment.strategy";
import { CashPaymentStrategy } from "@/strategies/payment/cash.strategy";
import { BankTransferPaymentStrategy } from "@/strategies/payment/bank-transfer.strategy";
import { PromptPayPaymentStrategy } from "@/strategies/payment/promptpay.strategy";
import type { PaymentMethod } from "@/types";

const strategyMap: Record<PaymentMethod, () => PaymentStrategy> = {
  cash: () => new CashPaymentStrategy(),
  bank_transfer: () => new BankTransferPaymentStrategy(),
  promptpay: () => new PromptPayPaymentStrategy(),
};

export class PaymentFactory {
  static create(method: PaymentMethod): PaymentStrategy {
    const creator = strategyMap[method];
    if (!creator) {
      throw new Error(`Unknown payment method: ${method}`);
    }
    return creator();
  }
}
