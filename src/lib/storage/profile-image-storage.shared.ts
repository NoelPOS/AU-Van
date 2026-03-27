import crypto from "crypto";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateProfileImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Invalid image type. Please upload JPG, PNG, or WEBP.");
  }
  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Image is too large. Maximum allowed size is 5MB.");
  }
}

export function getProfileImageExtension(file: File): string {
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  return "";
}

export function buildProfileImageObjectKey(userId: string, extension: string): string {
  return `profile-images/${userId}/${Date.now()}-${crypto.randomUUID()}${extension}`;
}

export function buildPublicAssetUrl(baseUrl: string, objectKey: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  return `${normalized}/${objectKey}`;
}
