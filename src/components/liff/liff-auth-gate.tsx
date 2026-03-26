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
      login: (config?: { redirectUri?: string }) => void;
      getIDToken: () => string | null;
      getProfile: () => Promise<{ displayName: string; pictureUrl?: string }>;
    };
  }
}

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
          window.liff.login({ redirectUri: window.location.href });
          return;
        }

        const idToken = window.liff.getIDToken();
        if (!idToken) throw new Error("Unable to read LIFF ID token");

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
          throw new Error(result.error);
        }
      } catch (err) {
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
        <Button asChild className="mt-4 h-8 bg-[#3f53c9] text-[11px] hover:bg-[#3447b4]">
          <Link href="/auth">Use web login</Link>
        </Button>
      </div>
    </div>
  );
}
