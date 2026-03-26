import type { PaymentProofStoragePort } from "./payment-proof-storage.port";
import { LocalPaymentProofStorage } from "./payment-proof-storage.local";
import { R2PaymentProofStorage } from "./payment-proof-storage.r2";
import { InlinePaymentProofStorage } from "./payment-proof-storage.inline";

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

function shouldUseInlineFallback(): boolean {
  const mode = (process.env.PAYMENT_PROOF_R2_FALLBACK || "inline").trim().toLowerCase();
  return mode === "inline";
}

function isR2TransportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /eproto|ssl|tls|handshake|econnreset|enotfound|eai_again|timeout/i.test(message);
}

export async function savePaymentProofFile(file: File, bookingId: string): Promise<string> {
  const storage = createPaymentProofStorage();

  try {
    return await storage.save(file, bookingId);
  } catch (error) {
    if (storage instanceof R2PaymentProofStorage && isR2TransportError(error) && shouldUseInlineFallback()) {
      console.error("R2 upload failed. Falling back to inline proof storage.", error);
      const inlineStorage = new InlinePaymentProofStorage();
      return inlineStorage.save(file, bookingId);
    }
    throw error;
  }
}
