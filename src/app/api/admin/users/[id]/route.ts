import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { userService } from "@/services/user.service";
import { successResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const user = await userService.getUserById(params.id);
    if (!user) return notFoundResponse("User");
    return successResponse(user);
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

    const result = await userService.toggleAdmin(params.id);
    return successResponse(result, "Admin status toggled");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
