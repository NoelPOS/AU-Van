import type { ProfileImageStoragePort } from "./profile-image-storage.port";
import { LocalProfileImageStorage } from "./profile-image-storage.local";
import { R2ProfileImageStorage } from "./profile-image-storage.r2";

function getStorageDriver(): "local" | "r2" {
  const driver = (process.env.PAYMENT_PROOF_STORAGE_DRIVER || "local").trim().toLowerCase();
  if (driver === "local" || driver === "r2") return driver;
  throw new Error("PAYMENT_PROOF_STORAGE_DRIVER must be one of: local, r2");
}

function createProfileImageStorage(): ProfileImageStoragePort {
  const driver = getStorageDriver();
  if (driver === "r2") return new R2ProfileImageStorage();
  return new LocalProfileImageStorage();
}

export async function saveProfileImageFile(file: File, userId: string) {
  const storage = createProfileImageStorage();
  return storage.save(file, userId);
}

export async function deleteProfileImageFile(key: string) {
  const storage = createProfileImageStorage();
  return storage.remove(key);
}
