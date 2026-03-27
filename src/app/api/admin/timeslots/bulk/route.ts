import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { timeslotService } from "@/services/timeslot.service";
import { bulkCreateTimeslotSchema } from "@/validators/timeslot.validator";
import { successResponse, errorResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const parsed = bulkCreateTimeslotSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    if (parsed.data.dateFrom > parsed.data.dateTo) {
      return errorResponse("dateFrom must be on or before dateTo");
    }

    const result = await timeslotService.bulkCreateTimeslots(parsed.data);
    return successResponse(result, `Created ${result.created} timeslot(s), skipped ${result.skipped} duplicate(s)`, 201);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
