import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { seatService } from "@/services/seat.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { timeslotId: string } }) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const seats = await seatService.getSeatsForTimeslot(params.timeslotId);
    return successResponse(seats);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// Lock seats for selection
export async function POST(req: NextRequest, { params }: { params: { timeslotId: string } }) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { seatIds } = await req.json();
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return errorResponse("seatIds array is required");
    }

    const lockedSeats = await seatService.lockSeats(params.timeslotId, seatIds, session!.user._id);
    return successResponse(lockedSeats, "Seats locked");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}

// Release locked seats
export async function DELETE(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { seatIds } = await req.json();
    if (!Array.isArray(seatIds)) {
      return errorResponse("seatIds array is required");
    }

    await seatService.releaseSeats(seatIds, session!.user._id);
    return successResponse(null, "Seats released");
  } catch (err) {
    return serverErrorResponse(err);
  }
}
