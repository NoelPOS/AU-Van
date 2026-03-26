import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { paymentService } from "@/services/payment.service";
import { updatePaymentSchema } from "@/validators/payment.validator";
import { successResponse, errorResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const parsed = updatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const payment = await paymentService.reviewPayment(
      params.id,
      session!.user._id,
      parsed.data,
      {
        ip: req.headers.get("x-forwarded-for") || req.ip || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      }
    );

    return successResponse(payment, "Payment updated");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
