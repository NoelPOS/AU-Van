import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { linkRichMenuToAllUsers } from "@/lib/line-messaging";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const richMenuId =
      (await req.json().catch(() => ({} as { richMenuId?: string }))).richMenuId ||
      process.env.LINE_RICH_MENU_ID;

    if (!richMenuId) {
      return errorResponse("richMenuId is required or LINE_RICH_MENU_ID must be configured", 422);
    }

    const result = await linkRichMenuToAllUsers(richMenuId);
    if (!result.ok) {
      return errorResponse(result.error || "Rich menu sync failed", result.status || 500);
    }

    return successResponse(
      {
        richMenuId,
        requestId: result.requestId || null,
        status: result.status,
      },
      "Rich menu synced"
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
