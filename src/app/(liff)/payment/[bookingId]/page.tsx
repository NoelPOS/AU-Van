"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiffPageLoading } from "@/components/shared/loading";
import { LiffPageHeader } from "@/components/layout/liff-page-header";
import { useBooking, useSubmitPaymentProof } from "@/hooks/queries";

export default function PaymentProofPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [proofReference, setProofReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const proofIdempotencyKeyRef = useRef("");
  const qrImageUrl = process.env.NEXT_PUBLIC_PAYMENT_QR_IMAGE_URL?.trim() || "";
  const accountName = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME?.trim() || "";
  const accountNumber = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER?.trim() || "";
  const bankName = process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME?.trim() || "";

  const { data: booking, isLoading } = useBooking(bookingId);
  const submitProofMutation = useSubmitPaymentProof();

  const payment = booking?.paymentId as {
    method: "cash" | "bank_transfer" | "promptpay";
    status: "pending" | "pending_review" | "completed" | "failed" | "refunded";
  } | undefined;

  useEffect(() => {
    proofIdempotencyKeyRef.current = "";
  }, [proofReference, paidAt, proofImage]);

  const submitProof = async () => {
    if (!proofImage || !proofReference) return;
    setError("");

    try {
      const formData = new FormData();
      formData.append("proofImage", proofImage);
      formData.append("proofReference", proofReference);
      if (paidAt) formData.append("paidAt", paidAt);

      const key =
        proofIdempotencyKeyRef.current ||
        (proofIdempotencyKeyRef.current = crypto.randomUUID());
      formData.append("idempotencyKey", key);

      await submitProofMutation.mutateAsync({ bookingId, formData });
      router.push("/mybookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit payment proof");
    }
  };

  const saving = submitProofMutation.isPending;

  if (isLoading) {
    return <LiffPageLoading title="Loading payment details" subtitle="Preparing your booking summary..." />;
  }

  if (!booking) {
    return (
      <div className="px-4 py-8">
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error || "Booking not found"}
        </p>
      </div>
    );
  }

  const routeData = booking.routeId as { from: string; to: string } | undefined;
  const timeslotData = booking.timeslotId as { date: string; time: string } | undefined;

  return (
    <div className="px-4 pb-6 pt-3">
      <LiffPageHeader
        title="Pay and Upload Proof"
        subtitle="Complete payment and submit slip for admin review"
        showBack
        backHref="/mybookings"
      />

      <div className="rounded-xl border border-[#d6dcf4] bg-white p-3">
        <p className="text-[11px] font-semibold text-[#3041a1]">
          {routeData ? `${routeData.from} - ${routeData.to}` : "Route"}
        </p>
        <p className="mt-1 text-[10px] text-[#6f7cb6]">
          {timeslotData?.date || "-"} {timeslotData?.time || ""}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#3041a1]">{booking.totalPrice} THB</p>
        <p className="mt-1 text-[10px] uppercase text-[#6f7cb6]">
          Method: {payment?.method?.replace("_", " ") || "bank transfer"}
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
        <p className="text-[10px] font-semibold uppercase text-[#7682bb]">How to pay</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-[#3041a1]">
          <li>Transfer exactly {booking.totalPrice} THB.</li>
          <li>Use the reference from your banking app.</li>
          <li>Upload your slip image for admin review.</li>
        </ol>

        {payment?.method === "promptpay" && qrImageUrl && (
          <div className="mt-3 rounded-lg border border-[#dbe1f7] bg-[#f8f9ff] p-2">
            <p className="mb-2 text-[10px] font-semibold uppercase text-[#6f7cb6]">PromptPay QR</p>
            <Image
              src={qrImageUrl}
              alt="PromptPay QR code"
              width={1000}
              height={1000}
              className="mx-auto w-full max-w-[240px] rounded-md border border-[#d7dcf3] bg-white object-contain"
            />
          </div>
        )}

        {(accountName || accountNumber || bankName) && (
          <div className="mt-3 rounded-lg border border-[#dbe1f7] bg-[#f8f9ff] p-2 text-[11px] text-[#3041a1]">
            {accountName && <p>Account Name: {accountName}</p>}
            {accountNumber && <p>Account Number: {accountNumber}</p>}
            {bankName && <p>Bank: {bankName}</p>}
          </div>
        )}

        {!qrImageUrl && payment?.method === "promptpay" && (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700">
            QR image not configured yet. Set NEXT_PUBLIC_PAYMENT_QR_IMAGE_URL in env.
          </p>
        )}
      </div>

      <div className="mt-3 space-y-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
        <div>
          <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
            Transfer Reference
          </Label>
          <Input
            value={proofReference}
            onChange={(event) => setProofReference(event.target.value)}
            className="h-8 border-[#d7dcf3] text-xs text-[#27378f]"
            placeholder="e.g. KPLUS-123456"
          />
        </div>

        <div>
          <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
            Paid At (optional)
          </Label>
          <Input
            type="datetime-local"
            value={paidAt}
            onChange={(event) => setPaidAt(event.target.value)}
            className="h-8 border-[#d7dcf3] text-xs text-[#27378f]"
          />
        </div>

        <div>
          <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
            Slip Image (JPG/PNG/WEBP)
          </Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="h-8 border-[#d7dcf3] text-xs text-[#27378f]"
            onChange={(event) => setProofImage(event.target.files?.[0] || null)}
          />
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-600">
            {error}
          </p>
        )}

        <Button
          className="h-8 w-full bg-[#3f53c9] text-[11px] hover:bg-[#3447b4]"
          disabled={saving || !proofReference || !proofImage}
          onClick={submitProof}
        >
          {saving ? "Submitting..." : "Submit for Review"}
        </Button>
      </div>
    </div>
  );
}
