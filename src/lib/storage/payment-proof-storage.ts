import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function savePaymentProofFile(
  file: File,
  bookingId: string
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are supported");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Proof image must be 5MB or smaller");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = extname(file.name || "").toLowerCase() || ".jpg";
  const folder = join(process.cwd(), "public", "uploads", "payment-proofs");
  await mkdir(folder, { recursive: true });

  const filename = `${bookingId}-${Date.now()}${extension}`;
  const target = join(folder, filename);
  await writeFile(target, buffer);

  return `/uploads/payment-proofs/${filename}`;
}
