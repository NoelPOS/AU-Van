"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckCircle2, Clock3, Eye, XCircle } from "lucide-react";
import { useAdminPayments, useReviewPayment } from "@/hooks/queries";
import { PAYMENT_STATUS_VARIANT, formatStatus as fmtStatus } from "@/constants/status-styles";

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

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}


export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | PaymentStatus>("pending_review");
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const { data, isLoading, error: queryError } = useAdminPayments({
    status: statusFilter || undefined,
    page,
    limit: 20,
  });
  const reviewPayment = useReviewPayment();

  const payments = (data?.payments || []) as unknown as PaymentItem[];
  const totalPages = data?.totalPages || 1;

  const title = useMemo(
    () => (statusFilter === "pending_review" ? "Payment Review Queue" : "All Payments"),
    [statusFilter]
  );

  useEffect(() => {
    if (!selectedPayment) {
      setReviewNote("");
      return;
    }
    setReviewNote(selectedPayment.reviewNote || "");
  }, [selectedPayment]);

  const submitReview = async (paymentId: string, status: "completed" | "failed") => {
    await reviewPayment.mutateAsync({
      id: paymentId,
      status,
      reviewNote: reviewNote.trim() || undefined,
    });
    setSelectedPayment(null);
  };

  const error = queryError?.message || (reviewPayment.error?.message) || "";

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
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              setStatusFilter((v === "all" ? "" : v) as "" | PaymentStatus);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52 rounded-xl">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            {isLoading ? (
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
                                Booking {fmtStatus(payment.bookingId?.status || "unknown")}
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
                              ? `${payment.bookingId.routeId.from || "N/A"} -> ${payment.bookingId.routeId.to || "N/A"}`
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-sm font-semibold">{payment.amount} THB</TableCell>
                          <TableCell className="text-sm uppercase text-muted-foreground">
                            {payment.method.replace("_", " ")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(payment.proofSubmittedAt || payment.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={PAYMENT_STATUS_VARIANT[payment.status] ?? "outline"}>
                              {fmtStatus(payment.status)}
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
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1}
                      onClick={() => setPage((prev) => prev - 1)}>Previous</Button>
                    <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages}
                      onClick={() => setPage((prev) => prev + 1)}>Next</Button>
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
          if (!open && !reviewPayment.isPending) setSelectedPayment(null);
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
                  <p><span className="font-semibold">Booking:</span> {selectedPayment.bookingId?.bookingCode || selectedPayment.bookingId?._id || "-"}</p>
                  <p><span className="font-semibold">Amount:</span> {selectedPayment.amount} THB</p>
                  <p><span className="font-semibold">Method:</span> {selectedPayment.method.replace("_", " ")}</p>
                  <p><span className="font-semibold">Reference:</span> {selectedPayment.proofReference || selectedPayment.transactionId || "-"}</p>
                  <p><span className="font-semibold">Submitted:</span> {formatDateTime(selectedPayment.proofSubmittedAt || selectedPayment.createdAt)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slip image</p>
                  {selectedPayment.proofImageUrl ? (
                    <Image src={selectedPayment.proofImageUrl} alt="Payment proof" width={960} height={720}
                      className="w-full rounded-xl border border-border object-contain" />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No image uploaded</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reviewNote" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review note</label>
                <textarea id="reviewNote" rows={4} value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional reason (required when rejecting is recommended)" />
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setSelectedPayment(null)} disabled={reviewPayment.isPending}>Close</Button>
                <Button variant="destructive" onClick={() => submitReview(selectedPayment._id, "failed")} disabled={reviewPayment.isPending}>
                  <XCircle className="mr-1 h-4 w-4" />{reviewPayment.isPending ? "Saving..." : "Reject"}
                </Button>
                <Button onClick={() => submitReview(selectedPayment._id, "completed")} disabled={reviewPayment.isPending}>
                  <CheckCircle2 className="mr-1 h-4 w-4" />{reviewPayment.isPending ? "Saving..." : "Approve"}
                </Button>
              </DialogFooter>

              {selectedPayment.status !== "pending_review" && (
                <div className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <Clock3 className="h-3.5 w-3.5" />This payment has already been reviewed.
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
