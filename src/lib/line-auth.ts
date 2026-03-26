interface LineVerifyResponse {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
}

export async function verifyLineIdToken(idToken: string): Promise<LineVerifyResponse> {
  const channelId = process.env.LINE_LIFF_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_LIFF_ID;
  if (!channelId) {
    throw new Error("LINE channel ID is not configured");
  }

  const body = new URLSearchParams({
    id_token: idToken,
    client_id: channelId,
  });

  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.sub) {
    throw new Error("Invalid LINE token");
  }

  return result as LineVerifyResponse;
}
