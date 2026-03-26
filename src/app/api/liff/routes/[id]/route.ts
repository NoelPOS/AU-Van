import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { routeService } from "@/services/route.service";
import { successResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const route = await routeService.getRouteById(params.id);
    if (!route || route.status !== "active") return notFoundResponse("Route");
    return successResponse(route);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
