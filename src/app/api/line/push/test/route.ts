import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { sendLinePushMessage } from "@/lib/line-messaging";
import { successResponse, errorResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

const pushTestSchema = z.object({
  lineUserId: z.string().min(1),
  message: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const parsed = pushTestSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const result = await sendLinePushMessage(parsed.data.lineUserId, [
      { type: "text", text: parsed.data.message },
    ]);

    if (!result.ok) {
      return errorResponse(result.error || "LINE push failed", result.status || 500);
    }

    return successResponse(
      { requestId: result.requestId || null, status: result.status },
      "LINE push test sent"
    );
  } catch (err) {
    return serverErrorResponse(err);
  }
}
