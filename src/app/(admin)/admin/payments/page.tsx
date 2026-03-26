"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckCircle2, Clock3, Eye, XCircle } from "lucide-react";

type PaymentStatus = "pending" | "pending_review" | "completed" | "failed" | "refunded";

type PaymentItem = {
  _id: string;
  amount: number;
  method: "cash" | "bank_transfer" | "promptpay";
  status: PaymentStatus;
  transactionId?: string;
  proofImageUrl?: string;
  proofReference?: string;
  proofSubmittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  userId?: { name?: string; email?: string };
  bookingId?: {
    _id?: string;
    bookingCode?: string;
    status?: string;
    routeId?: { from?: string; to?: string };
    userId?: { name?: string; email?: string };
  };
  reviewedBy?: { name?: string; email?: string };
};

const paymentStatusStyles: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  pending_review: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-slate-50 text-slate-700 border-slate-300",
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | PaymentStatus>("pending_review");
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(
    () => (statusFilter === "pending_review" ? "Payment Review Queue" : "All Payments"),
    [statusFilter]
  );

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      const json = await response.json();
      if (!json.success) {
        setError(json.error || "Failed to load payments");
        return;
      }

      setPayments(json.data.payments || []);
      setTotalPages(json.data.totalPages || 1);
    } catch {
      setError("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (!selectedPayment) {
      setReviewNote("");
      return;
    }
    setReviewNote(selectedPayment.reviewNote || "");
  }, [selectedPayment]);

  const submitReview = async (paymentId: string, status: "completed" | "failed") => {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewNote: reviewNote.trim() || undefined,
        }),
      });
      const json = await response.json();
      if (!json.success) {
        setError(json.error || "Failed to update payment");
        return;
      }

      setSelectedPayment(null);
      await fetchPayments();
    } catch {
      setError("Failed to update payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Review payment proofs and approve or reject PromptPay / bank transfers
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "" | PaymentStatus);
              setPage(1);
            }}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending_review">Pending review</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => fetchPayments()}
          >
            Refresh
          </Button>
        </div>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            {loading ? (
              <PageLoading />
            ) : payments.length === 0 ? (
              <EmptyState
                title="No payments found"
                description="No payment records match the current filter."
              />
            ) : (
              <>
                {error && (
                  <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Proof Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-foreground">
                                {payment.bookingId?.bookingCode || payment.bookingId?._id || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Booking {formatStatus(payment.bookingId?.status || "unknown")}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <p className="text-sm font-medium">
                              {payment.userId?.name || payment.bookingId?.userId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.userId?.email || payment.bookingId?.userId?.email || "-"}
                            </p>
                          </TableCell>

                          <TableCell className="text-sm">
                            {payment.bookingId?.routeId
                              ? `${payment.bookingId.routeId.from || "N/A"} -> ${
                                  payment.bookingId.routeId.to || "N/A"
                                }`
                              : "N/A"}
                          </TableCell>

                          <TableCell className="text-sm font-semibold">
                            {payment.amount} THB
                          </TableCell>

                          <TableCell className="text-sm uppercase text-muted-foreground">
                            {payment.method.replace("_", " ")}
                          </TableCell>

                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(payment.proofSubmittedAt || payment.createdAt)}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={paymentStatusStyles[payment.status] || ""}
                            >
                              {formatStatus(payment.status)}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={payment.status === "pending_review" ? "default" : "outline"}
                              className="rounded-xl"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              {payment.status === "pending_review" ? "Review" : "Details"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => prev - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={page >= totalPages}
                      onClick={() => setPage((prev) => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selectedPayment)}
        onOpenChange={(open) => {
          if (!open && !submitting) setSelectedPayment(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedPayment && (
            <>
              <DialogHeader>
                <DialogTitle>Payment Review</DialogTitle>
                <DialogDescription>
                  Verify slip details, then approve or reject this payment.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Booking:</span>{" "}
                    {selectedPayment.bookingId?.bookingCode || selectedPayment.bookingId?._id || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Amount:</span> {selectedPayment.amount} THB
                  </p>
                  <p>
                    <span className="font-semibold">Method:</span>{" "}
                    {selectedPayment.method.replace("_", " ")}
                  </p>
                  <p>
                    <span className="font-semibold">Reference:</span>{" "}
                    {selectedPayment.proofReference || selectedPayment.transactionId || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Submitted:</span>{" "}
                    {formatDateTime(
                      selectedPayment.proofSubmittedAt || selectedPayment.createdAt
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Slip image
                  </p>
                  {selectedPayment.proofImageUrl ? (
                    <Image
                      src={selectedPayment.proofImageUrl}
                      alt="Payment proof"
                      width={960}
                      height={720}
                      className="w-full rounded-xl border border-border object-contain"
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      No image uploaded
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="reviewNote"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Review note
                </label>
                <textarea
                  id="reviewNote"
                  rows={4}
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional reason (required when rejecting is recommended)"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPayment(null)}
                  disabled={submitting}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => submitReview(selectedPayment._id, "failed")}
                  disabled={submitting}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  {submitting ? "Saving..." : "Reject"}
                </Button>
                <Button
                  onClick={() => submitReview(selectedPayment._id, "completed")}
                  disabled={submitting}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  {submitting ? "Saving..." : "Approve"}
                </Button>
              </DialogFooter>

              {selectedPayment.status !== "pending_review" && (
                <div className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <Clock3 className="h-3.5 w-3.5" />
                  This payment has already been reviewed.
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
