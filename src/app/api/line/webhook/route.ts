import { NextRequest } from "next/server";
import { verifyLineWebhookSignature } from "@/lib/line-webhook";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

type LineWebhookEvent = {
  type: string;
  source?: { userId?: string; type?: string };
  replyToken?: string;
  message?: { type?: string; text?: string };
  postback?: { data?: string };
};

export async function POST(req: NextRequest) {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret) {
      return errorResponse("LINE_CHANNEL_SECRET is not configured", 503);
    }

    const signature = req.headers.get("x-line-signature");
    if (!signature) return errorResponse("Missing LINE signature", 401);

    const rawBody = await req.text();
    const valid = verifyLineWebhookSignature(rawBody, signature, channelSecret);
    if (!valid) return errorResponse("Invalid LINE signature", 401);

    const payload = JSON.parse(rawBody) as { events?: LineWebhookEvent[] };
    const events = payload.events || [];

    // Scaffold handler: logs normalized event payloads for later bot workflows.
    for (const event of events) {
      console.info("[LINE webhook]", {
        type: event.type,
        sourceType: event.source?.type,
        sourceUserId: event.source?.userId,
        text: event.message?.text,
        postback: event.postback?.data,
      });
    }

    return successResponse({ received: events.length });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
