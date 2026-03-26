"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiffPageLoading } from "@/components/shared/loading";

interface BookingSnapshot {
  _id: string;
  totalPrice: number;
  routeId?: { from: string; to: string };
  timeslotId?: { date: string; time: string };
  paymentId?: {
    method: "cash" | "bank_transfer" | "promptpay";
    status: "pending" | "pending_review" | "completed" | "failed" | "refunded";
  };
}

export default function PaymentProofPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingSnapshot | null>(null);
  const [proofReference, setProofReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const proofIdempotencyKeyRef = useRef("");
  const qrImageUrl = process.env.NEXT_PUBLIC_PAYMENT_QR_IMAGE_URL?.trim() || "";
  const accountName = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME?.trim() || "";
  const accountNumber = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER?.trim() || "";
  const bankName = process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME?.trim() || "";

  useEffect(() => {
    fetch(`/api/liff/bookings/${bookingId}`)
      .then((response) => response.json())
      .then((json) => {
        if (!json.success) {
          setError(json.error || "Booking not found");
          return;
        }
        setBooking(json.data);
      })
      .catch(() => setError("Failed to load booking"))
      .finally(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => {
    proofIdempotencyKeyRef.current = "";
  }, [proofReference, paidAt, proofImage]);

  const submitProof = async () => {
    if (!proofImage || !proofReference) return;
    setSaving(true);
    setError("");

    try {
      const form = new FormData();
      form.append("proofImage", proofImage);
      form.append("proofReference", proofReference);
      if (paidAt) form.append("paidAt", paidAt);

      const response = await fetch(`/api/liff/bookings/${bookingId}/payment-proof`, {
        method: "POST",
        headers: {
          "Idempotency-Key":
            proofIdempotencyKeyRef.current ||
            (proofIdempotencyKeyRef.current = crypto.randomUUID()),
        },
        body: form,
      });
      const json = await response.json();
      if (!json.success) {
        setError(json.error || "Failed to submit payment proof");
        return;
      }

      router.push("/mybookings");
    } catch {
      setError("Failed to submit payment proof");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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

  return (
    <div className="px-4 pb-6 pt-3">
      <h1 className="text-sm font-semibold text-[#1f2f8d]">Pay and Upload Proof</h1>

      <div className="mt-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
        <p className="text-[11px] font-semibold text-[#3041a1]">
          {booking.routeId ? `${booking.routeId.from} - ${booking.routeId.to}` : "Route"}
        </p>
        <p className="mt-1 text-[10px] text-[#6f7cb6]">
          {booking.timeslotId?.date || "-"} {booking.timeslotId?.time || ""}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#3041a1]">{booking.totalPrice} THB</p>
        <p className="mt-1 text-[10px] uppercase text-[#6f7cb6]">
          Method: {booking.paymentId?.method?.replace("_", " ") || "bank transfer"}
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
        <p className="text-[10px] font-semibold uppercase text-[#7682bb]">How to pay</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-[#3041a1]">
          <li>Transfer exactly {booking.totalPrice} THB.</li>
          <li>Use the reference from your banking app.</li>
          <li>Upload your slip image for admin review.</li>
        </ol>

        {booking.paymentId?.method === "promptpay" && qrImageUrl && (
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

        {!qrImageUrl && booking.paymentId?.method === "promptpay" && (
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
