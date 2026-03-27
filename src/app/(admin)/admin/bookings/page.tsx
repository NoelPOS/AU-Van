"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { Ban, X } from "lucide-react";
import { useAdminBookings, useAdminCancelBooking } from "@/hooks/queries";
import { BOOKING_STATUS_VARIANT, formatStatus } from "@/constants/status-styles";

const STATUS_OPTIONS = [
  { value: "pending_payment",       label: "Pending Payment" },
  { value: "payment_under_review",  label: "Payment Under Review" },
  { value: "confirmed",             label: "Confirmed" },
  { value: "reschedule_requested",  label: "Reschedule Requested" },
  { value: "completed",             label: "Completed" },
  { value: "cancelled",             label: "Cancelled" },
];

const ACTIVE_STATUSES = new Set(["pending_payment", "payment_under_review", "confirmed", "reschedule_requested"]);

export default function AdminBookingsPage() {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminBookings({
    all: true, page, limit: 20,
    ...(dateFilter && { date: dateFilter }),
    ...(statusFilter && { status: statusFilter }),
  });
  const cancelBooking = useAdminCancelBooking();

  const bookings = data?.bookings || [];
  const totalPages = data?.totalPages || 1;
  const hasFilters = dateFilter || statusFilter;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">All Bookings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage and review all booking records</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="w-auto rounded-xl"
          />
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}
          >
            <SelectTrigger className="w-52 rounded-xl">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="rounded-xl text-xs"
              onClick={() => { setDateFilter(""); setStatusFilter(""); setPage(1); }}>
              <X className="mr-1 h-3 w-3" /> Clear
            </Button>
          )}
        </div>

        {cancelBooking.error && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {cancelBooking.error.message}
          </div>
        )}

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            {isLoading ? <PageLoading /> : bookings.length === 0 ? <EmptyState title="No bookings found" /> : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Passengers</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((b) => {
                        const user = b.userId as { name?: string; email?: string } | undefined;
                        const route = b.routeId as { from: string; to: string } | undefined;
                        const timeslot = b.timeslotId as { date: string; time: string } | undefined;
                        const payment = b.paymentId as { method?: string } | undefined;
                        return (
                          <TableRow key={b._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-semibold text-primary">
                                  {(user?.name || b.passengerName || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{user?.name || b.passengerName}</p>
                                  <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {route ? `${route.from} → ${route.to}` : "N/A"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {timeslot ? `${timeslot.date} ${timeslot.time}` : "N/A"}
                            </TableCell>
                            <TableCell>{b.passengers}</TableCell>
                            <TableCell className="font-semibold">{b.totalPrice} THB</TableCell>
                            <TableCell className="text-sm text-muted-foreground capitalize">
                              {payment?.method?.replace(/_/g, " ") || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={BOOKING_STATUS_VARIANT[b.status] ?? "outline"}>
                                {formatStatus(b.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {ACTIVE_STATUSES.has(b.status) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                      <Ban className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        The customer will be notified via LINE and in-app. Seats will be released.
                                        Handle any refund manually with the customer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Keep</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => cancelBooking.mutate(b._id)}>
                                        Cancel Booking
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl"
                      disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" className="rounded-xl"
                      disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
