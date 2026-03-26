import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { notificationService } from "@/services/notification.service";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 20;
    const skip = Number(searchParams.get("skip")) || 0;

    const [notifications, unreadCount] = await Promise.all([
      notificationService.getUserNotifications(session!.user._id, limit, skip),
      notificationService.getUnreadCount(session!.user._id),
    ]);

    return successResponse({ notifications, unreadCount });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// Mark all as read
export async function PUT(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    await notificationService.markAllAsRead(session!.user._id);
    return successResponse(null, "All notifications marked as read");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
