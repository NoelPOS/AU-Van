export interface PaymentProofStoragePort {
  save(file: File, bookingId: string): Promise<string>;
}

