// Strategy Pattern - Payment Processing

export interface PaymentRequest {
  bookingId: string;
  userId: string;
  amount: number;
  method: string;
  transactionId?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface PaymentStrategy {
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  processRefund(transactionId: string, amount: number): Promise<PaymentResult>;
  validatePayment(transactionId: string): Promise<boolean>;
}
