import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { bookingService } from "@/services/booking.service";
import { successResponse, notFoundResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const booking = await bookingService.getBookingById(params.id);
    if (!booking) return notFoundResponse("Booking");
    return successResponse(booking);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const booking = await bookingService.cancelBooking(
      params.id,
      session!.user._id,
      true
    );
    return successResponse(booking, "Booking cancelled");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
