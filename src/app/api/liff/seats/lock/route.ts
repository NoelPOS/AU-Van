import { z } from "zod";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { seatService } from "@/services/seat.service";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";

const lockSeatSchema = z.object({
  timeslotId: z.string().min(1),
  seatIds: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const parsed = lockSeatSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const seats = await seatService.lockSeats(
      parsed.data.timeslotId,
      parsed.data.seatIds,
      session!.user._id
    );
    return successResponse(seats, "Seats locked");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
