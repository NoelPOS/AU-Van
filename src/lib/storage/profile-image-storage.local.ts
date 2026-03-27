import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import type { ProfileImageStoragePort } from "./profile-image-storage.port";
import {
  buildProfileImageObjectKey,
  getProfileImageExtension,
  validateProfileImageFile,
} from "./profile-image-storage.shared";

export class LocalProfileImageStorage implements ProfileImageStoragePort {
  async save(file: File, userId: string): Promise<{ url: string; key: string }> {
    validateProfileImageFile(file);

    const extension = getProfileImageExtension(file);
    const key = buildProfileImageObjectKey(userId, extension);
    const folder = join(process.cwd(), "public", "uploads");
    const target = join(folder, key);

    await mkdir(join(folder, "profile-images", userId), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(target, buffer);

    return { key, url: `/uploads/${key}` };
  }

  async remove(key: string): Promise<void> {
    if (!key) return;
    const target = join(process.cwd(), "public", "uploads", key);
    try {
      await unlink(target);
    } catch {
      // Best effort cleanup.
    }
  }
}
