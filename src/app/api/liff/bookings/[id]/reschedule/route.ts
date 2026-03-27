import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { BookingConflictError, bookingService } from "@/services/booking.service";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";

const rescheduleSchema = z.object({
  timeslotId: z.string().min(1),
  seatIds: z.array(z.string()).min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const booking = await bookingService.rescheduleBooking(
      params.id,
      session!.user._id,
      parsed.data
    );

    return successResponse(booking, "Reschedule request created");
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json(
        { success: false, error: err.message, data: err.details },
        { status: err.statusCode }
      );
    }
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
