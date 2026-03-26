import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { PaymentProofStoragePort } from "./payment-proof-storage.port";
import {
  buildPaymentProofObjectKey,
  getPaymentProofExtension,
  validatePaymentProofFile,
} from "./payment-proof-storage.shared";

export class LocalPaymentProofStorage implements PaymentProofStoragePort {
  async save(file: File, bookingId: string): Promise<string> {
    validatePaymentProofFile(file);

    const extension = getPaymentProofExtension(file);
    const objectKey = buildPaymentProofObjectKey(bookingId, extension);
    const folder = join(process.cwd(), "public", "uploads");
    const target = join(folder, objectKey);

    await mkdir(join(folder, "payment-proofs", bookingId), { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(target, buffer);

    return `/uploads/${objectKey}`;
  }
}
