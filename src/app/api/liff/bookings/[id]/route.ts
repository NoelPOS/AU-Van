import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { bookingService } from "@/services/booking.service";
import { updateBookingSchema } from "@/validators/booking.validator";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const booking = await bookingService.getBookingById(params.id, session!.user._id);
    if (!booking) return notFoundResponse("Booking");
    return successResponse(booking);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const booking = await bookingService.updateBooking(
      params.id,
      session!.user._id,
      parsed.data
    );
    return successResponse(booking, "Booking updated");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const booking = await bookingService.cancelBooking(params.id, session!.user._id);
    return successResponse(booking, "Booking cancelled");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
