"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/shared/loading";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, MapPin, Users, CreditCard, ArrowRight, TrendingUp,
} from "lucide-react";
import { useAdminBookings } from "@/hooks/queries";
import { BOOKING_STATUS_VARIANT, formatStatus } from "@/constants/status-styles";

export default function AdminDashboard() {
  const { data, isLoading } = useAdminBookings({ limit: 10, all: true });

  const stats = useMemo(() => {
    if (!data?.bookings) return null;
    const bookings = data.bookings;
    const today = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter((b) => String(b.createdAt)?.startsWith(today));
    return {
      totalBookingsToday: todayBookings.length,
      totalRevenue: bookings.reduce((sum, b) => b.status !== "cancelled" ? sum + (b.totalPrice || 0) : sum, 0),
      totalPassengers: bookings.reduce((sum, b) => b.status !== "cancelled" ? sum + (b.passengers || 0) : sum, 0),
      activeRoutes: new Set(bookings.map((b) => typeof b.routeId === "object" && b.routeId ? (b.routeId as { _id?: string })._id : b.routeId).filter(Boolean)).size,
      recentBookings: bookings.slice(0, 8),
    };
  }, [data]);

  if (isLoading) return <PageLoading />;

  const statCards = [
    { label: "Today's Bookings", value: stats?.totalBookingsToday || 0, icon: BookOpen, gradient: "from-primary/10 to-primary/5", iconColor: "text-primary bg-primary/10" },
    { label: "Total Revenue", value: `${stats?.totalRevenue || 0} THB`, icon: TrendingUp, gradient: "from-emerald-50 to-emerald-50/50", iconColor: "text-emerald-600 bg-emerald-100" },
    { label: "Total Passengers", value: stats?.totalPassengers || 0, icon: Users, gradient: "from-purple-50 to-purple-50/50", iconColor: "text-purple-600 bg-purple-100" },
    { label: "Active Routes", value: stats?.activeRoutes || 0, icon: MapPin, gradient: "from-amber-50 to-amber-50/50", iconColor: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Overview of your van service operations</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-2xl border border-border/60 bg-gradient-to-br ${s.gradient} p-5`}>
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconColor}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-foreground">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { href: "/admin/bookings", label: "All Bookings", icon: BookOpen, desc: "View and manage bookings" },
            { href: "/admin/users", label: "Users", icon: Users, desc: "Manage user accounts" },
            { href: "/admin/payments", label: "Payments", icon: CreditCard, desc: "Review payment status" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <link.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <Card className="rounded-2xl border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <Button asChild size="sm" variant="ghost" className="text-xs">
              <Link href="/admin/bookings">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentBookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet</p>
            ) : (
              <div className="space-y-2">
                {stats?.recentBookings.map((b) => {
                  const route = b.routeId as { from: string; to: string } | undefined;
                  const timeslot = b.timeslotId as { date: string; time: string } | undefined;
                  const user = b.userId as { name: string } | undefined;
                  return (
                    <div key={b._id} className="flex items-center justify-between rounded-xl border border-border/40 p-3.5 transition-colors hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                          {(user?.name || b.passengerName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user?.name || b.passengerName || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {route ? `${route.from} → ${route.to}` : "N/A"}
                            {timeslot ? ` | ${timeslot.date}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">{b.totalPrice} THB</span>
                        <Badge variant={BOOKING_STATUS_VARIANT[b.status] ?? "outline"}>{formatStatus(b.status)}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
