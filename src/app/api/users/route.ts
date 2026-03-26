import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { userService } from "@/services/user.service";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    const result = await userService.getAllUsers(page, limit);
    return successResponse(result);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
