import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { bookingService } from "@/services/booking.service";
import { idempotencyService } from "@/services/idempotency.service";
import { createBookingSchema } from "@/validators/booking.validator";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const bookings = await bookingService.getUserBookings(session!.user._id);
    return successResponse(bookings);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  let idempotencyRecordId: string | null = null;
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const parsed = createBookingSchema.safeParse({
      ...body,
      sourceChannel: "liff",
    });
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const idem = await idempotencyService.startRequest({
      userId: session!.user._id,
      scope: "liff_booking_create",
      key: req.headers.get("idempotency-key"),
      payload: parsed.data,
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

    const booking = await bookingService.createBooking(session!.user._id, parsed.data);
    if (idempotencyRecordId) {
      await idempotencyService.completeRequest(idempotencyRecordId, booking, 201);
    }
    return successResponse(booking, "Booking created", 201);
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
