import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { timeslotService } from "@/services/timeslot.service";
import { createTimeslotSchema } from "@/validators/timeslot.validator";
import { successResponse, errorResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get("routeId");
    if (!routeId) return errorResponse("routeId is required");
    const date = searchParams.get("date") || undefined;

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 15)));

    const result = await timeslotService.getTimeslotsByRoutePaginated(routeId, page, limit, date);
    return successResponse(result);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const parsed = createTimeslotSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const timeslot = await timeslotService.createTimeslot(parsed.data);
    return successResponse(timeslot, "Timeslot created", 201);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
