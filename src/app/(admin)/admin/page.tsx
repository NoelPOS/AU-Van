"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/shared/loading";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, MapPin, Users, CreditCard, ArrowRight, TrendingUp,
} from "lucide-react";

interface Stats {
  totalBookingsToday: number;
  totalRevenue: number;
  totalPassengers: number;
  activeRoutes: number;
  recentBookings: Array<{
    _id: string;
    passengerName?: string;
    status: string;
    totalPrice: number;
    routeId?: { from: string; to: string };
    timeslotId?: { date: string; time: string };
    userId?: { name: string };
  }>;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  completed: "bg-primary/5 text-primary border-primary/20",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/bookings?limit=10")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const bookings = json.data.bookings || [];
          const today = new Date().toISOString().split("T")[0];
          const todayBookings = bookings.filter((b: any) => b.createdAt?.startsWith(today));
          setStats({
            totalBookingsToday: todayBookings.length,
            totalRevenue: bookings.reduce((sum: number, b: any) => b.status !== "cancelled" ? sum + (b.totalPrice || 0) : sum, 0),
            totalPassengers: bookings.reduce((sum: number, b: any) => b.status !== "cancelled" ? sum + (b.passengers || 0) : sum, 0),
            activeRoutes: new Set(bookings.map((b: any) => b.routeId?._id).filter(Boolean)).size,
            recentBookings: bookings.slice(0, 8),
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  const statCards = [
    { label: "Today's Bookings", value: stats?.totalBookingsToday || 0, icon: BookOpen, gradient: "from-primary/10 to-primary/5", iconColor: "text-primary bg-primary/10" },
    { label: "Total Revenue", value: `${stats?.totalRevenue || 0} THB`, icon: TrendingUp, gradient: "from-emerald-50 to-emerald-50/50", iconColor: "text-emerald-600 bg-emerald-100" },
    { label: "Total Passengers", value: stats?.totalPassengers || 0, icon: Users, gradient: "from-purple-50 to-purple-50/50", iconColor: "text-purple-600 bg-purple-100" },
    { label: "Active Routes", value: stats?.activeRoutes || 0, icon: MapPin, gradient: "from-amber-50 to-amber-50/50", iconColor: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Overview of your van service operations</p>
        </div>

        {/* Stats */}
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

        {/* Quick actions */}
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

        {/* Recent Bookings */}
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
                {stats?.recentBookings.map((b) => (
                  <div key={b._id} className="flex items-center justify-between rounded-xl border border-border/40 p-3.5 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                        {(b.userId?.name || b.passengerName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.userId?.name || b.passengerName || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.routeId ? `${b.routeId.from} → ${b.routeId.to}` : "N/A"}
                          {b.timeslotId ? ` | ${b.timeslotId.date}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{b.totalPrice} THB</span>
                      <Badge variant="outline" className={statusStyles[b.status] || ""}>{b.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
