import { NextRequest } from "next/server";
import { reminderService } from "@/services/reminder.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

function isAuthorized(req: NextRequest): boolean {
  const workerSecret = process.env.REMINDER_WORKER_SECRET;
  const workerHeader = req.headers.get("x-reminder-secret");

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  const workerAuthorized = !!workerSecret && workerHeader === workerSecret;
  const cronAuthorized = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  return workerAuthorized || cronAuthorized;
}

async function processReminderBatch(limit: number) {
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 20;
  const result = await reminderService.processDueReminders(normalizedLimit);
  return successResponse(result, "Reminder batch processed");
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return errorResponse("Unauthorized worker request", 401);
    }

    const limit = Number(req.nextUrl.searchParams.get("limit")) || 200;
    return processReminderBatch(limit);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return errorResponse("Unauthorized worker request", 401);
    }

    const body = await req.json().catch(() => ({}));
    const limit = Number(body?.limit) || 20;
    return processReminderBatch(limit);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
