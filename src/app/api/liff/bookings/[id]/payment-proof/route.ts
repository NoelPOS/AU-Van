import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { bookingService } from "@/services/booking.service";
import { idempotencyService } from "@/services/idempotency.service";
import { savePaymentProofFile } from "@/lib/storage/payment-proof-storage";
import { submitPaymentProofSchema } from "@/validators/payment.validator";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let idempotencyRecordId: string | null = null;
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("proofImage");
    const proofReference = String(formData.get("proofReference") || "").trim();
    const paidAt = String(formData.get("paidAt") || "").trim();

    if (!(file instanceof File)) {
      return errorResponse("proofImage file is required");
    }

    const parsed = submitPaymentProofSchema.safeParse({
      proofReference,
      paidAt: paidAt || undefined,
    });
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const idem = await idempotencyService.startRequest({
      userId: session!.user._id,
      scope: "liff_payment_proof_submit",
      key: req.headers.get("idempotency-key"),
      payload: {
        bookingId: params.id,
        proofReference: parsed.data.proofReference,
        paidAt: parsed.data.paidAt || null,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    });
    if (idem.mode === "replay") {
      return successResponse(idem.data, "Idempotent replay", idem.statusCode);
    }
    if (idem.mode === "conflict") {
      return errorResponse(idem.reason, 409);
    }
    if (idem.mode === "new") {
      idempotencyRecordId = idem.recordId;
    }

    const proofImageUrl = await savePaymentProofFile(file, params.id);
    const payment = await bookingService.submitPaymentProof(
      params.id,
      session!.user._id,
      {
        proofImageUrl,
        proofReference: parsed.data.proofReference,
        paidAt: parsed.data.paidAt,
      }
    );

    if (idempotencyRecordId) {
      await idempotencyService.completeRequest(idempotencyRecordId, payment, 200);
    }

    return successResponse(payment, "Payment proof submitted");
  } catch (err) {
    if (idempotencyRecordId) {
      await idempotencyService.failRequest(
        idempotencyRecordId,
        err instanceof Error ? err.message : "Unknown error"
      );
    }
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
