import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { timeslotService } from "@/services/timeslot.service";
import { updateTimeslotSchema } from "@/validators/timeslot.validator";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const timeslot = await timeslotService.getTimeslotById(params.id);
    if (!timeslot) return notFoundResponse("Timeslot");
    return successResponse(timeslot);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const parsed = updateTimeslotSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const timeslot = await timeslotService.updateTimeslot(params.id, parsed.data);
    return successResponse(timeslot, "Timeslot updated");
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
    const { error } = await requireAdmin();
    if (error) return error;

    await timeslotService.cancelTimeslot(params.id);
    return successResponse(null, "Timeslot cancelled");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
