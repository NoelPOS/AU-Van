type LinePushResult = {
  ok: boolean;
  status: number;
  requestId?: string | null;
  error?: string;
};

export type LinePushMessage =
  | { type: "text"; text: string }
  | {
      type: "flex";
      altText: string;
      contents: Record<string, unknown>;
    };

function getLineChannelAccessToken(): string | null {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || null;
}

export async function sendLinePushMessage(
  to: string,
  messages: LinePushMessage[]
): Promise<LinePushResult> {
  const token = getLineChannelAccessToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "LINE_CHANNEL_ACCESS_TOKEN is not configured",
    };
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      messages,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    return {
      ok: false,
      status: response.status,
      requestId: response.headers.get("x-line-request-id"),
      error: payload || "LINE push request failed",
    };
  }

  return {
    ok: true,
    status: response.status,
    requestId: response.headers.get("x-line-request-id"),
  };
}

export async function linkRichMenuToAllUsers(
  richMenuId: string
): Promise<LinePushResult> {
  const token = getLineChannelAccessToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "LINE_CHANNEL_ACCESS_TOKEN is not configured",
    };
  }

  const response = await fetch(
    `https://api.line.me/v2/bot/user/all/richmenu/${encodeURIComponent(richMenuId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    return {
      ok: false,
      status: response.status,
      requestId: response.headers.get("x-line-request-id"),
      error: payload || "Failed to link rich menu",
    };
  }

  return {
    ok: true,
    status: response.status,
    requestId: response.headers.get("x-line-request-id"),
  };
}
