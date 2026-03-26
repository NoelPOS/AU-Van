import type { PaymentProofStoragePort } from "./payment-proof-storage.port";
import { validatePaymentProofFile } from "./payment-proof-storage.shared";

const DEFAULT_INLINE_MAX_BYTES = 1_000_000; // Keep API payloads manageable.

function getInlineMaxBytes(): number {
  const configured = Number(process.env.PAYMENT_PROOF_INLINE_MAX_BYTES);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_INLINE_MAX_BYTES;
  return configured;
}

export class InlinePaymentProofStorage implements PaymentProofStoragePort {
  async save(file: File, _bookingId: string): Promise<string> {
    validatePaymentProofFile(file);

    const maxBytes = getInlineMaxBytes();
    if (file.size > maxBytes) {
      throw new Error(
        `R2 upload failed and inline fallback is limited to ${Math.floor(
          maxBytes / 1024
        )}KB. Compress the image or fix R2 credentials.`
      );
    }

    const mime = file.type || "image/jpeg";
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    return `data:${mime};base64,${base64}`;
  }
}
