import { extname } from "path";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function validatePaymentProofFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are supported");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Proof image must be 5MB or smaller");
  }
}

export function getPaymentProofExtension(file: File): string {
  const fromMime = MIME_EXTENSION_MAP[file.type];
  if (fromMime) return fromMime;
  return extname(file.name || "").toLowerCase() || ".jpg";
}

export function buildPaymentProofObjectKey(bookingId: string, extension: string): string {
  return `payment-proofs/${bookingId}/${Date.now()}-${crypto.randomUUID()}${extension}`;
}

export function buildPublicAssetUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${key}`;
}

