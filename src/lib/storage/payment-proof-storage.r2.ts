import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { PaymentProofStoragePort } from "./payment-proof-storage.port";
import {
  buildPaymentProofObjectKey,
  buildPublicAssetUrl,
  getPaymentProofExtension,
  validatePaymentProofFile,
} from "./payment-proof-storage.shared";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
};

function readR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() || "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucketName = process.env.R2_BUCKET_NAME?.trim() || "";
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim() || "";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl) {
    throw new Error(
      "R2 storage is enabled but missing required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL"
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicBaseUrl };
}

export class R2PaymentProofStorage implements PaymentProofStoragePort {
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

  async save(file: File, bookingId: string): Promise<string> {
    validatePaymentProofFile(file);

    const extension = getPaymentProofExtension(file);
    const objectKey = buildPaymentProofObjectKey(bookingId, extension);
    const body = Buffer.from(await file.arrayBuffer());

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: objectKey,
        Body: body,
        ContentType: file.type || "application/octet-stream",
      })
    );

    return buildPublicAssetUrl(this.config.publicBaseUrl, objectKey);
  }
}

