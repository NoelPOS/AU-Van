"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    liff?: {
      init: (config: {
        liffId: string;
        withLoginOnExternalBrowser?: boolean;
      }) => Promise<void>;
      isLoggedIn: () => boolean;
      logout?: () => void;
      login: (config?: { redirectUri?: string }) => void;
      getIDToken: () => string | null;
      getProfile: () => Promise<{ displayName: string; pictureUrl?: string }>;
    };
  }
}

type JwtPayload = {
  exp?: number;
};

async function loadLiffScript(): Promise<void> {
  if (window.liff) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector("script[data-liff-sdk='true']");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load LIFF SDK")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
    script.async = true;
    script.dataset.liffSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load LIFF SDK"));
    document.head.appendChild(script);
  });
}

function parseJwtPayload(idToken: string): JwtPayload | null {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function isIdTokenExpired(idToken: string): boolean {
  const payload = parseJwtPayload(idToken);
  if (!payload?.exp) return false;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

function isExpiredTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  const normalized = message.toLowerCase();
  return normalized.includes("idtoken expired") || normalized.includes("id token expired");
}

function reloginWithLine() {
  if (!window.liff) return;
  try {
    if (window.liff.isLoggedIn() && window.liff.logout) {
      window.liff.logout();
    }
  } catch {
    // Ignore logout failures and continue with login redirect.
  }
  window.liff.login({ redirectUri: window.location.href });
}

export function LiffAuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "unauthenticated") return;

    let cancelled = false;

    async function authenticateWithLiff() {
      const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
      if (!liffId) {
        setError("LIFF credentials are not configured yet. Use web login temporarily.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        await loadLiffScript();
        if (!window.liff) throw new Error("LIFF SDK is unavailable");

        await window.liff.init({
          liffId,
          withLoginOnExternalBrowser: true,
        });

        if (!window.liff.isLoggedIn()) {
          reloginWithLine();
          return;
        }

        const idToken = window.liff.getIDToken();
        if (!idToken) throw new Error("Unable to read LIFF ID token");
        if (isIdTokenExpired(idToken)) {
          reloginWithLine();
          return;
        }

        let displayName = "";
        let avatar = "";
        try {
          const profile = await window.liff.getProfile();
          displayName = profile.displayName || "";
          avatar = profile.pictureUrl || "";
        } catch {
          // Profile is optional for session bootstrap.
        }

        const result = await signIn("liff", {
          idToken,
          displayName,
          avatar,
          redirect: false,
        });

        if (result?.error) {
          if (isExpiredTokenError(result.error)) {
            reloginWithLine();
            return;
          }
          throw new Error(result.error);
        }
      } catch (err) {
        if (isExpiredTokenError(err)) {
          reloginWithLine();
          return;
        }
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "LIFF authentication failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void authenticateWithLiff();

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className="px-4 py-6">
      <div className="rounded-xl border border-[#d4daf2] bg-white p-5 text-center">
        <p className="text-sm font-semibold text-[#1f2f8d]">Signing in with LINE...</p>
        <p className="mt-2 text-xs text-[#6674b0]">
          {loading ? "Checking your LIFF session." : "Waiting for authentication."}
        </p>
        {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
        <Button onClick={reloginWithLine} className="mt-4 h-8 bg-[#3f53c9] text-[11px] hover:bg-[#3447b4]">
          Retry LINE login
        </Button>
        <div className="mt-2">
          <Button asChild variant="ghost" className="h-7 text-[11px] text-[#5d6ec6] hover:text-[#2f3f9f]">
            <Link href="/auth">Use web login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
