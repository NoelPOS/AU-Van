import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { routeService } from "@/services/route.service";
import { updateRouteSchema } from "@/validators/route.validator";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const route = await routeService.getRouteById(params.id);
    if (!route) return notFoundResponse("Route");
    return successResponse(route);
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
    const parsed = updateRouteSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const route = await routeService.updateRoute(params.id, parsed.data);
    return successResponse(route, "Route updated");
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

    await routeService.deleteRoute(params.id);
    return successResponse(null, "Route deactivated");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
