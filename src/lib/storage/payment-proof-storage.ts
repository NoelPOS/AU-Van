import type { PaymentProofStoragePort } from "./payment-proof-storage.port";
import { LocalPaymentProofStorage } from "./payment-proof-storage.local";
import { R2PaymentProofStorage } from "./payment-proof-storage.r2";

function getStorageDriver(): "local" | "r2" {
  const driver = (process.env.PAYMENT_PROOF_STORAGE_DRIVER || "local").trim().toLowerCase();
  if (driver === "local" || driver === "r2") return driver;
  throw new Error("PAYMENT_PROOF_STORAGE_DRIVER must be one of: local, r2");
}

function createPaymentProofStorage(): PaymentProofStoragePort {
  const driver = getStorageDriver();
  if (driver === "r2") return new R2PaymentProofStorage();
  return new LocalPaymentProofStorage();
}

export async function savePaymentProofFile(file: File, bookingId: string): Promise<string> {
  const storage = createPaymentProofStorage();
  return storage.save(file, bookingId);
}
