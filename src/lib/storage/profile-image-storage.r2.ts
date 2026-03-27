import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ProfileImageStoragePort } from "./profile-image-storage.port";
import {
  buildProfileImageObjectKey,
  buildPublicAssetUrl,
  getProfileImageExtension,
  validateProfileImageFile,
} from "./profile-image-storage.shared";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
};

function normalizeEnv(value?: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function readR2Config(): R2Config {
  const accountId = normalizeEnv(process.env.R2_ACCOUNT_ID);
  const accessKeyId = normalizeEnv(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = normalizeEnv(process.env.R2_SECRET_ACCESS_KEY);
  const bucketName = normalizeEnv(process.env.R2_BUCKET_NAME);
  const publicBaseUrl = normalizeEnv(process.env.R2_PUBLIC_BASE_URL);

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl) {
    throw new Error(
      "R2 storage is enabled but missing required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL"
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicBaseUrl };
}

export class R2ProfileImageStorage implements ProfileImageStoragePort {
  private readonly config: R2Config;
  private readonly client: S3Client;

  constructor() {
    this.config = readR2Config();
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  async save(file: File, userId: string): Promise<{ url: string; key: string }> {
    validateProfileImageFile(file);

    const extension = getProfileImageExtension(file);
    const key = buildProfileImageObjectKey(userId, extension);
    const body = Buffer.from(await file.arrayBuffer());

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: body,
        ContentType: file.type || "application/octet-stream",
      })
    );

    return { key, url: buildPublicAssetUrl(this.config.publicBaseUrl, key) };
  }

  async remove(key: string): Promise<void> {
    if (!key) return;
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      })
    );
  }
}
