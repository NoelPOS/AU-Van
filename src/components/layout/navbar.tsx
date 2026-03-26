"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  MapPin,
  BookOpen,
  User,
  Shield,
  LogOut,
  LayoutDashboard,
  Clock,
  Route,
  Users,
  CreditCard,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

const userLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/routes", label: "Book Van", icon: MapPin },
  { href: "/mybookings", label: "My Bookings", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
  { href: "/admin/timeslots", label: "Timeslots", icon: Clock },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session?.user) return null;

  const isAdmin = session.user.isAdmin;
  const isAdminPage = pathname.startsWith("/admin");

  return (
    <nav className="sticky top-0 z-40 border-b border-border/50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-au-gradient shadow-sm transition-transform group-hover:scale-105">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-2-2.2-3.3C12.4 4.8 11.2 4 9.8 4H5.5c-.8 0-1.4.4-1.8 1L2 8.4C1.4 9.1 1 10 1 11v5c0 .6.4 1 1 1h1" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none tracking-tight text-foreground">AU Van</span>
            {isAdminPage && (
              <span className="text-[10px] font-medium uppercase tracking-widest text-primary">Admin</span>
            )}
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          {isAdmin && (
            <div className="mr-2 flex items-center rounded-lg border border-border/60 bg-muted/50 p-0.5">
              <Link href="/"
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  !isAdminPage ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                User
              </Link>
              <Link href="/admin"
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  isAdminPage ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Shield className="mr-1 inline h-3 w-3" />Admin
              </Link>
            </div>
          )}

          {(isAdminPage && isAdmin ? adminLinks : userLinks).map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <NotificationBell />

          <div className="hidden items-center gap-2 border-l border-border/50 pl-3 lg:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {session.user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="text-[13px] font-medium text-foreground">
              {session.user.name?.split(" ")[0]}
            </span>
          </div>

          <button onClick={() => signOut({ callbackUrl: "/auth" })}
            className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive md:flex"
            title="Sign out">
            <LogOut className="h-3.5 w-3.5" />
          </button>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 hover:bg-muted md:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-slide-up border-t border-border/50 bg-white px-4 py-3 md:hidden">
          {isAdmin && (
            <div className="mb-3 flex rounded-lg border border-border/60 bg-muted/50 p-0.5">
              <Link href="/" onClick={() => setMobileOpen(false)}
                className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-all ${
                  !isAdminPage ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                }`}>User</Link>
              <Link href="/admin" onClick={() => setMobileOpen(false)}
                className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-all ${
                  isAdminPage ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                }`}>Admin</Link>
            </div>
          )}
          <div className="space-y-0.5">
            {(isAdminPage && isAdmin ? adminLinks : userLinks).map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}>
                  <Icon className="h-4 w-4" />{link.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 border-t border-border/50 pt-3">
            <button onClick={() => signOut({ callbackUrl: "/auth" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
