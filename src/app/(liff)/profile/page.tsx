"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageLoading } from "@/components/shared/loading";
import { User, Lock, Trash2, Check, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setProfile({ name: json.data.name || "", phone: json.data.phone || "" });
        }
      })
      .finally(() => setLoading(false));
  }, [session]);

  const showMsg = (type: string, text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) {
      showMsg("success", "Profile updated");
      update({ name: profile.name, phone: profile.phone });
    } else {
      showMsg("error", json.error || "Update failed");
    }
  };

  const handlePasswordChange = async () => {
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwords),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) {
      showMsg("success", "Password changed");
      setPasswords({ oldPassword: "", newPassword: "" });
    } else {
      showMsg("error", json.error || "Password change failed");
    }
  };

  const handleDeleteAccount = async () => {
    const res = await fetch("/api/users/me", { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      signOut({ callbackUrl: "/auth" });
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-lg px-4 py-10 space-y-5">
        {/* Header with avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{session?.user?.name}</h1>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>

        {msg.text && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            msg.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-destructive/20 bg-destructive/5 text-destructive"
          }`}>
            {msg.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg.text}
          </div>
        )}

        {/* Profile Info */}
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Email</Label>
              <Input value={session?.user?.email || ""} disabled className="mt-1.5 rounded-xl bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs font-medium">Name</Label>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-medium">Phone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
            <Button onClick={handleProfileUpdate} disabled={saving} className="w-full rounded-xl">
              {saving ? "Saving..." : "Update Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Current Password</Label>
              <Input type="password" value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-medium">New Password</Label>
              <Input type="password" value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Min. 6 characters" className="mt-1.5 rounded-xl" />
            </div>
            <Button onClick={handlePasswordChange}
              disabled={saving || !passwords.oldPassword || passwords.newPassword.length < 6}
              className="w-full rounded-xl">
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="rounded-2xl border-destructive/20">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="font-semibold text-destructive">Delete Account</p>
              <p className="text-xs text-muted-foreground">This action is permanent and cannot be undone</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="rounded-xl">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone. All your data will be permanently deleted.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount}>Delete Account</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
