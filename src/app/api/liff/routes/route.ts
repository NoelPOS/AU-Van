import { requireAuth } from "@/lib/auth-guard";
import { routeService } from "@/services/route.service";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const routes = await routeService.getAllRoutes(true);
    return successResponse(routes);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
