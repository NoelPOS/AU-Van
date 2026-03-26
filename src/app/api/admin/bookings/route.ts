import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { bookingService } from "@/services/booking.service";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const result = await bookingService.getAllBookings({
      status: searchParams.get("status") || undefined,
      date: searchParams.get("date") || undefined,
      routeId: searchParams.get("routeId") || undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
    });
    return successResponse(result);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
