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
        setError("LINE login is not configured yet.");
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
      <div className="rounded-2xl border border-[#d4dcfb] bg-white px-5 py-6 text-center shadow-[0_10px_24px_rgba(41,68,178,0.08)]">
        <div className="mx-auto mb-3 h-11 w-11 rounded-full border border-[#cfdaff] bg-gradient-to-br from-[#f0f4ff] to-[#e5ecff] p-2.5">
          <div className="h-full w-full animate-spin rounded-full border-2 border-[#b9c8ff] border-t-[#4f62d3]" />
        </div>
        <p className="text-base font-semibold text-[#1f2f8d]">Signing in with LINE</p>
        <p className="mt-1 text-xs text-[#6674b0]">
          {loading ? "Refreshing your LIFF session..." : "Waiting for authentication..."}
        </p>

        {error && (
          <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-2 py-1.5 text-[11px] text-red-600">
            {error}
          </p>
        )}

        <Button onClick={reloginWithLine} className="mt-4 h-9 w-full bg-[#3f53c9] text-[12px] font-semibold hover:bg-[#3447b4]">
          Retry LINE Login
        </Button>
        <div className="mt-2">
          <Button asChild variant="ghost" className="h-7 text-[11px] text-[#5d6ec6] hover:text-[#2f3f9f]">
            <Link href="/auth">Use web login (fallback/admin)</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
