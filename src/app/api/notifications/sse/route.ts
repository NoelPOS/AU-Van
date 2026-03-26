import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { sseManager } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user._id;
  const clientId = `${userId}-${Date.now()}`;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`)
      );

      // Register client
      sseManager.addClient(clientId, userId, controller);

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          sseManager.removeClient(clientId);
        }
      }, 30000);
    },
    cancel() {
      sseManager.removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
