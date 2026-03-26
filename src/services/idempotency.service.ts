import crypto from "crypto";
import IdempotencyKey from "@/models/IdempotencyKey";

type StartRequestParams = {
  userId: string;
  scope: string;
  key?: string | null;
  payload: unknown;
};

type StartRequestResult =
  | { mode: "skip" }
  | { mode: "new"; recordId: string }
  | { mode: "replay"; statusCode: number; data: unknown }
  | { mode: "conflict"; reason: string };

function buildPayloadHash(payload: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload ?? {}))
    .digest("hex");
}

class IdempotencyService {
  private static instance: IdempotencyService;

  private constructor() {}

  static getInstance(): IdempotencyService {
    if (!IdempotencyService.instance) {
      IdempotencyService.instance = new IdempotencyService();
    }
    return IdempotencyService.instance;
  }

  async startRequest(params: StartRequestParams): Promise<StartRequestResult> {
    const normalizedKey = params.key?.trim();
    if (!normalizedKey) return { mode: "skip" };



    const requestHash = buildPayloadHash(params.payload);
    let existing = await IdempotencyKey.findOne({
      userId: params.userId,
      scope: params.scope,
      key: normalizedKey,
    });

    if (!existing) {
      try {
        const created = await IdempotencyKey.create({
          userId: params.userId,
          scope: params.scope,
          key: normalizedKey,
          requestHash,
          status: "in_progress",
        });
        return { mode: "new", recordId: String(created._id) };
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        existing = await IdempotencyKey.findOne({
          userId: params.userId,
          scope: params.scope,
          key: normalizedKey,
        });
      }
    }

    if (!existing) {
      return {
        mode: "conflict",
        reason: "Unable to establish idempotent request state. Try again.",
      };
    }

    if (existing.requestHash !== requestHash) {
      return {
        mode: "conflict",
        reason: "Idempotency key already used with different payload.",
      };
    }

    if (existing.status === "completed") {
      return {
        mode: "replay",
        statusCode: existing.responseStatus || 200,
        data: existing.responseData,
      };
    }

    if (existing.status === "in_progress") {
      return {
        mode: "conflict",
        reason: "Request with this idempotency key is currently in progress.",
      };
    }

    existing.status = "in_progress";
    existing.errorMessage = undefined;
    await existing.save();

    return { mode: "new", recordId: String(existing._id) };
  }

  async completeRequest(
    recordId: string,
    responseData: unknown,
    responseStatus = 200
  ): Promise<void> {

    await IdempotencyKey.findByIdAndUpdate(recordId, {
      $set: {
        status: "completed",
        responseData,
        responseStatus,
        errorMessage: undefined,
      },
    });
  }

  async failRequest(recordId: string, errorMessage: string): Promise<void> {

    await IdempotencyKey.findByIdAndUpdate(recordId, {
      $set: {
        status: "failed",
        errorMessage,
      },
    });
  }
}

export const idempotencyService = IdempotencyService.getInstance();
