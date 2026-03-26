import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { routeService } from "@/services/route.service";
import { createRouteSchema } from "@/validators/route.validator";
import { successResponse, errorResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const routes = await routeService.getAllRoutes(false);
    return successResponse(routes);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const parsed = createRouteSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const route = await routeService.createRoute(parsed.data);
    return successResponse(route, "Route created", 201);
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
