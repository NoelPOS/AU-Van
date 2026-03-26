import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { notificationService } from "@/services/notification.service";
import { successResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-response";

// Mark single notification as read
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const notification = await notificationService.markAsRead(params.id, session!.user._id);
    if (!notification) return notFoundResponse("Notification");

    return successResponse(notification);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    await notificationService.deleteNotification(params.id, session!.user._id);
    return successResponse(null, "Notification deleted");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
