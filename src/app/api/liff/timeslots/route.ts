import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { timeslotService } from "@/services/timeslot.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get("routeId");
    const date = searchParams.get("date");
    if (!routeId) return errorResponse("routeId is required");

    const timeslots = date
      ? await timeslotService.getAvailableTimeslots(routeId, date)
      : await timeslotService.getTimeslotsByRoute(routeId);

    return successResponse(timeslots);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
