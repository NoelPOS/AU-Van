interface LineVerifyResponse {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
}

type JwtPayload = {
  aud?: string;
};

function normalizeEnv(value?: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function resolveLineChannelId(): string {
  const configuredChannelId = normalizeEnv(process.env.LINE_LIFF_CHANNEL_ID);
  if (configuredChannelId) return configuredChannelId;

  // Fallback: derive channel id from LIFF ID prefix (e.g. 2001234567-AbCdEf -> 2001234567).
  const liffId = normalizeEnv(process.env.NEXT_PUBLIC_LINE_LIFF_ID);
  if (liffId) {
    const derived = liffId.split("-")[0];
    if (/^\d+$/.test(derived)) return derived;
  }

  throw new Error("LINE channel ID is not configured");
}

function parseTokenAudience(idToken: string): string | null {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    ) as JwtPayload;
    return payload.aud || null;
  } catch {
    return null;
  }
}

export async function verifyLineIdToken(idToken: string): Promise<LineVerifyResponse> {
  const channelId = resolveLineChannelId();

  const tokenAudience = parseTokenAudience(idToken);
  if (tokenAudience && tokenAudience !== channelId) {
    throw new Error(
      `LINE token audience mismatch (token aud=${tokenAudience}, expected channel=${channelId})`
    );
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
    const errorMessage =
      typeof result?.error_description === "string"
        ? result.error_description
        : typeof result?.error === "string"
          ? result.error
          : "";

    throw new Error(
      errorMessage ? `Invalid LINE token: ${errorMessage}` : "Invalid LINE token"
    );
  }

  return result as LineVerifyResponse;
}
