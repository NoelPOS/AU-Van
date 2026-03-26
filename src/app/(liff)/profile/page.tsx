"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { AlertCircle, CheckCircle2, Lock, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiffPageLoading } from "@/components/shared/loading";
import { LiffPageHeader } from "@/components/layout/liff-page-header";
import { useMe, useUpdateProfile } from "@/hooks/queries";

export default function ProfilePage() {
  const { update } = useSession();
  const { data: userData, isLoading } = useMe();
  const updateProfile = useUpdateProfile();

  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [initialized, setInitialized] = useState(false);

  // Initialize form when data loads
  if (userData && !initialized) {
    setProfile({ name: userData.name || "", phone: userData.phone || "" });
    setInitialized(true);
  }

  const showMsg = (type: string, text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const handleProfileUpdate = async () => {
    try {
      await updateProfile.mutateAsync(profile);
      showMsg("success", "Profile updated");
      update({ name: profile.name, phone: profile.phone });
    } catch (err) {
      showMsg("error", err instanceof Error ? err.message : "Update failed");
    }
  };

  const handlePasswordChange = async () => {
    try {
      await updateProfile.mutateAsync(passwords);
      showMsg("success", "Password updated");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (err) {
      showMsg("error", err instanceof Error ? err.message : "Password update failed");
    }
  };

  if (isLoading) {
    return <LiffPageLoading title="Loading profile" subtitle="Getting your account details..." />;
  }

  const provider = userData?.authProvider || "local";
  const canChangePassword = provider === "local";
  const email = userData?.email || "";
  const initials = (profile.name || email || "U").charAt(0).toUpperCase();
  const saving = updateProfile.isPending;

  return (
    <div className="px-4 pb-6 pt-3">
      <LiffPageHeader title="Profile" subtitle="Manage your account and sign-in settings" />

      <section className="rounded-2xl bg-gradient-to-br from-[#4259ce] to-[#2f45b6] px-4 py-4 text-white shadow-[0_16px_30px_rgba(31,47,141,0.25)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-base font-semibold">
            {initials}
          </div>
          <div>
            <h1 className="text-base font-semibold">{profile.name || "Profile"}</h1>
            <p className="text-[11px] text-white/80">{email}</p>
          </div>
        </div>
      </section>

      {msg.text && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] ${
            msg.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-red-100 bg-red-50 text-red-600"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {msg.text}
        </div>
      )}

      <section className="mt-3 rounded-2xl border border-[#d6dcf4] bg-white p-3 shadow-[0_8px_20px_rgba(57,85,194,0.06)]">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2b3d9e]">
          <UserRound className="h-4 w-4" />
          Account Information
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-[#7a86bc]">Email</Label>
            <Input value={email} disabled className="mt-1 h-9 border-[#d8def5] bg-[#f7f9ff] text-xs text-[#6470a8]" />
          </div>
          <div>
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-[#7a86bc]">Name</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-1 h-9 border-[#d8def5] text-xs text-[#23349a]"
            />
          </div>
          <div>
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-[#7a86bc]">Phone</Label>
            <Input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="mt-1 h-9 border-[#d8def5] text-xs text-[#23349a]"
              placeholder="e.g. 08xxxxxxxx"
            />
          </div>
          <Button
            onClick={handleProfileUpdate}
            disabled={saving}
            className="h-9 w-full bg-[#3f53c9] text-[12px] font-semibold hover:bg-[#3447b4]"
          >
            {saving ? "Saving..." : "Update Profile"}
          </Button>
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-[#d6dcf4] bg-white p-3 shadow-[0_8px_20px_rgba(57,85,194,0.06)]">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2b3d9e]">
          <ShieldCheck className="h-4 w-4" />
          Login Method
        </p>
        <p className="mt-2 text-[11px] text-[#6f7cb6]">
          {provider === "line"
            ? "This account is managed by LINE LIFF."
            : provider === "google"
              ? "This account uses Google sign-in."
              : "This account uses email and password."}
        </p>
      </section>

      {canChangePassword && (
        <section className="mt-3 rounded-2xl border border-[#d6dcf4] bg-white p-3 shadow-[0_8px_20px_rgba(57,85,194,0.06)]">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2b3d9e]">
            <Lock className="h-4 w-4" />
            Change Password
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-[#7a86bc]">
                Current Password
              </Label>
              <Input
                type="password"
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                className="mt-1 h-9 border-[#d8def5] text-xs text-[#23349a]"
              />
            </div>
            <div>
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-[#7a86bc]">
                New Password
              </Label>
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="mt-1 h-9 border-[#d8def5] text-xs text-[#23349a]"
                placeholder="At least 6 characters"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={saving || !passwords.oldPassword || passwords.newPassword.length < 6}
              className="h-9 w-full bg-[#3f53c9] text-[12px] font-semibold hover:bg-[#3447b4]"
            >
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </section>
      )}

      <div className="mt-4">
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/auth" })}
          className="h-8 w-full text-[11px] text-[#6f7cb6] hover:bg-[#eef2ff] hover:text-[#2f3f9f]"
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
