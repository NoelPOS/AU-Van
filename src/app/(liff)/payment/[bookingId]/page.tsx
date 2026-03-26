"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookingSnapshot {
  _id: string;
  totalPrice: number;
  routeId?: { from: string; to: string };
  timeslotId?: { date: string; time: string };
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
    return <p className="px-4 py-8 text-center text-xs text-[#6e7ab4]">Loading payment details...</p>;
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
      <h1 className="text-sm font-semibold text-[#1f2f8d]">Upload Payment Proof</h1>

      <div className="mt-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
        <p className="text-[11px] font-semibold text-[#3041a1]">
          {booking.routeId ? `${booking.routeId.from} - ${booking.routeId.to}` : "Route"}
        </p>
        <p className="mt-1 text-[10px] text-[#6f7cb6]">
          {booking.timeslotId?.date || "-"} {booking.timeslotId?.time || ""}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#3041a1]">{booking.totalPrice} THB</p>
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
