import { requireAuth } from "@/lib/auth-guard";
import { paymentService } from "@/services/payment.service";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const payments = await paymentService.getUserPayments(session!.user._id);
    return successResponse(payments);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
