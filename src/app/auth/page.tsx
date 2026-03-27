"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Shield } from "lucide-react";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid admin email or password");
        return;
      }

      const currentSession = await getSession();
      if (!currentSession?.user?.isAdmin) {
        setError("This portal is for admin accounts only.");
        return;
      }

      router.push("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 overflow-hidden bg-au-gradient-hero lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-dots opacity-[0.12]" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex flex-1 flex-col justify-center px-12 xl:px-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold leading-tight text-white xl:text-4xl">
            AU Van
            <br />
            <span className="text-[hsl(38,80%,65%)]">Admin Portal</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
            Manage routes, timeslots, users, bookings, and payment operations in one secure dashboard.
          </p>
        </div>

        <div className="relative px-12 pb-8 xl:px-16">
          <div className="flex items-center gap-6 text-xs text-white/30">
            <span>Assumption University</span>
            <span>&middot;</span>
            <span>Operations Console</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:max-w-xl">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Sign In</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Use your admin account to access the operations dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@au.edu"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                minLength={6}
                className="mt-1.5"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : "Sign In"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
