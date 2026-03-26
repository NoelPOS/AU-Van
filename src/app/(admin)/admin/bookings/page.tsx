"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Trash2, X } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  completed: "bg-primary/5 text-primary border-primary/20",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ all: "true", page: String(page), limit: "20" });
    if (dateFilter) params.set("date", dateFilter);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/admin/bookings?${params}`);
    const json = await res.json();
    if (json.success) {
      setBookings(json.data.bookings || []);
      setTotalPages(json.data.totalPages || 1);
    }
    setLoading(false);
  }, [dateFilter, page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id: string) => {
    const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) fetchBookings();
  };

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
          <Input type="date" value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="w-auto rounded-xl" />
          <select value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="rounded-xl text-xs"
              onClick={() => { setDateFilter(""); setStatusFilter(""); }}>
              <X className="mr-1 h-3 w-3" /> Clear
            </Button>
          )}
        </div>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            {loading ? <PageLoading /> : bookings.length === 0 ? <EmptyState title="No bookings found" /> : (
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
                      {bookings.map((b: any) => (
                        <TableRow key={b._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-semibold text-primary">
                                {(b.userId?.name || b.passengerName || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{b.userId?.name || b.passengerName}</p>
                                <p className="text-[11px] text-muted-foreground">{b.userId?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {b.routeId ? `${b.routeId.from} → ${b.routeId.to}` : "N/A"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {b.timeslotId ? `${b.timeslotId.date} ${b.timeslotId.time}` : "N/A"}
                          </TableCell>
                          <TableCell>{b.passengers}</TableCell>
                          <TableCell className="font-semibold">{b.totalPrice} THB</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{b.paymentId?.method || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusStyles[b.status] || ""}>{b.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {b.status !== "cancelled" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                                    <AlertDialogDescription>Seats will be released and payment refunded if applicable.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancel(b._id)}>Cancel Booking</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
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
