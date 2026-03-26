"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (res?.error) {
          setError("Invalid email or password");
        } else {
          const currentSession = await getSession();
          router.push(currentSession?.user?.isAdmin ? "/admin" : "/");
        }
      } else {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || data.message || "Signup failed");
        } else {
          await signIn("credentials", {
            email: form.email,
            password: form.password,
            redirect: false,
          });
          router.push("/");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branded panel */}
      <div className="relative hidden flex-1 overflow-hidden bg-au-gradient-hero lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-dots opacity-[0.12]" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex flex-1 flex-col justify-center px-12 xl:px-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-2-2.2-3.3C12.4 4.8 11.2 4 9.8 4H5.5c-.8 0-1.4.4-1.8 1L2 8.4C1.4 9.1 1 10 1 11v5c0 .6.4 1 1 1h1" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold leading-tight text-white xl:text-4xl">
            Campus rides,
            <br />
            <span className="text-[hsl(38,80%,65%)]">simplified.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
            Book your van seat in seconds. Real-time availability, seat selection, and instant booking confirmation.
          </p>
        </div>

        <div className="relative px-12 pb-8 xl:px-16">
          <div className="flex items-center gap-6 text-xs text-white/30">
            <span>Assumption University</span>
            <span>&middot;</span>
            <span>Campus Transportation</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:max-w-xl">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isLogin ? "Sign in to book your next ride" : "Join AU Van to start booking"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange}
                  placeholder="John Doe" required={!isLogin} minLength={3} className="mt-1.5" />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="you@au.edu" required className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="Min. 6 characters" required minLength={6} className="mt-1.5" />
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="phone" className="text-xs font-medium">Phone (optional)</Label>
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="0812345678" className="mt-1.5" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="font-semibold text-primary hover:underline">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
