"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Phone, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SeatMap } from "@/components/seats/seat-map";
import type { IRoute, ITimeslot, PaymentMethod } from "@/types";

type Step = "seats" | "details";

export default function BookPage() {
  const { routeId } = useParams<{ routeId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryDate = searchParams.get("date");
  const queryTimeslotId = searchParams.get("timeslotId");

  const [route, setRoute] = useState<IRoute | null>(null);
  const [timeslots, setTimeslots] = useState<ITimeslot[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    queryDate || new Date().toISOString().split("T")[0]
  );
  const [selectedTimeslot, setSelectedTimeslot] = useState<ITimeslot | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("seats");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [locksApplied, setLocksApplied] = useState(false);
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const bookingIdempotencyKeyRef = useRef("");

  const [form, setForm] = useState({
    passengerName: "",
    pickupLocation: "",
    passengerPhone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const loadRouteAndTimeslots = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [routeRes, timeslotRes] = await Promise.all([
        fetch(`/api/liff/routes/${routeId}`),
        fetch(`/api/liff/timeslots?routeId=${routeId}&date=${selectedDate}`),
      ]);

      const routeJson = await routeRes.json();
      const timeslotJson = await timeslotRes.json();

      if (!routeJson.success) {
        setError(routeJson.error || "Route not found");
        return;
      }
      setRoute(routeJson.data);

      const slotList: ITimeslot[] = timeslotJson.success ? timeslotJson.data || [] : [];
      setTimeslots(slotList);

      if (slotList.length === 0) {
        setSelectedTimeslot(null);
        return;
      }

      const fromQuery = slotList.find((slot) => slot._id === queryTimeslotId);
      setSelectedTimeslot(fromQuery || slotList[0]);
    } catch {
      setError("Failed to load booking data");
    } finally {
      setLoading(false);
    }
  }, [queryTimeslotId, routeId, selectedDate]);

  useEffect(() => {
    loadRouteAndTimeslots();
  }, [loadRouteAndTimeslots]);

  const releaseLockedSeats = useCallback(async () => {
    if (!locksApplied || !selectedTimeslot || selectedSeats.length === 0) return;
    try {
      await fetch(`/api/seats/${selectedTimeslot._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatIds: selectedSeats }),
      });
    } catch {
      // silent
    } finally {
      setLocksApplied(false);
    }
  }, [locksApplied, selectedSeats, selectedTimeslot]);

  useEffect(() => {
    return () => {
      if (!bookingCompleted) {
        void releaseLockedSeats();
      }
    };
  }, [bookingCompleted, releaseLockedSeats]);

  useEffect(() => {
    bookingIdempotencyKeyRef.current = "";
  }, [paymentMethod, form.passengerName, form.passengerPhone, form.pickupLocation, selectedTimeslot?._id, selectedSeats]);

  const selectedSeatCount = selectedSeats.length;
  const totalPrice = useMemo(() => (route ? route.price * selectedSeatCount : 0), [route, selectedSeatCount]);

  const lockSeatsAndContinue = async () => {
    if (!selectedTimeslot || selectedSeatCount === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/seats/${selectedTimeslot._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatIds: selectedSeats }),
      });
      const json = await response.json();
      if (!json.success) {
        setError(json.error || "Unable to lock seats. Please try again.");
        return;
      }

      setLocksApplied(true);
      setStep("details");
    } catch {
      setError("Unable to lock seats. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitBooking = async () => {
    if (!selectedTimeslot || !route) return;
    if (!form.passengerName || !form.passengerPhone || !form.pickupLocation) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/liff/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key":
            bookingIdempotencyKeyRef.current ||
            (bookingIdempotencyKeyRef.current = crypto.randomUUID()),
        },
        body: JSON.stringify({
          routeId,
          timeslotId: selectedTimeslot._id,
          seatIds: selectedSeats,
          passengerName: form.passengerName,
          passengerPhone: form.passengerPhone,
          pickupLocation: form.pickupLocation,
          paymentMethod,
          sourceChannel: "liff",
        }),
      });

      const json = await response.json();
      if (!json.success) {
        setError(json.error || "Booking failed");
        return;
      }

      setBookingCompleted(true);
      const bookingId = json.data?._id;
      if (paymentMethod === "cash" || !bookingId) {
        router.push("/mybookings");
      } else {
        router.push(`/payment/${bookingId}`);
      }
    } catch {
      setError("Something went wrong while confirming booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="px-4 py-8 text-center text-xs text-[#6e7ab4]">Loading booking flow...</p>;
  }

  if (!route) {
    return (
      <div className="px-4 py-8">
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error || "Route not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 pt-3">
      <button
        className="mb-2 inline-flex items-center gap-1 text-xs text-[#4f62d3]"
        onClick={() => {
          if (step === "details") {
            void releaseLockedSeats();
            setStep("seats");
            return;
          }
          router.push("/");
        }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <h1 className="text-sm font-semibold text-[#1f2f8d]">
        {step === "seats" ? "Choose Seat" : "Book your Seat"}
      </h1>

      <div className="mt-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
        <div className="space-y-1 text-[11px] text-[#4355b9]">
          <p className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {route.from} - {route.to}
          </p>
          <div className="pt-1">
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">Date</label>
            <div className="relative">
              <Input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => {
                  void releaseLockedSeats();
                  setSelectedDate(event.target.value);
                  setSelectedSeats([]);
                  setLocksApplied(false);
                }}
                className="h-8 border-[#d7dcf3] bg-white pr-8 text-xs text-[#26368f]"
              />
              <CalendarDays className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-[#91a0dd]" />
            </div>
          </div>
          <p className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {selectedTimeslot?.time || "-"}
          </p>
        </div>

        {timeslots.length > 0 ? (
          <div className="mt-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">Time</label>
            <select
              value={selectedTimeslot?._id || ""}
              onChange={(event) => {
                void releaseLockedSeats();
                const next = timeslots.find((slot) => slot._id === event.target.value) || null;
                setSelectedTimeslot(next);
                setSelectedSeats([]);
                setLocksApplied(false);
              }}
              className="h-8 w-full rounded-md border border-[#d7dcf3] bg-white px-2 text-xs text-[#26368f] focus:outline-none focus:ring-1 focus:ring-[#3f53c9]"
            >
              {timeslots.map((slot) => {
                const available = slot.totalSeats - slot.bookedSeats;
                return (
                  <option key={slot._id} value={slot._id}>
                    {slot.time} ({available} left)
                  </option>
                );
              })}
            </select>
          </div>
        ) : (
          <div className="mt-2 rounded-lg border border-dashed border-[#d6dcf4] bg-[#f9faff] px-3 py-2">
            <p className="text-[11px] font-semibold text-[#3041a1]">No departures on this date</p>
            <p className="mt-0.5 text-[10px] text-[#6f7cb6]">
              Select another date to see available timeslots.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {step === "seats" && (
        <div className="mt-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
          {selectedTimeslot ? (
            <>
              <SeatMap
                timeslotId={selectedTimeslot._id}
                selectedSeats={selectedSeats}
                onSelectionChange={setSelectedSeats}
                maxSeats={4}
              />

              <Button
                className="mt-3 h-10 w-full bg-[#3f53c9] text-sm font-semibold hover:bg-[#3447b4]"
                disabled={selectedSeatCount === 0 || submitting}
                onClick={lockSeatsAndContinue}
              >
                {submitting
                  ? "Locking seats..."
                  : `Continue (${selectedSeatCount} seat${selectedSeatCount === 1 ? "" : "s"})`}
              </Button>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-[#d6dcf4] bg-[#f9faff] px-4 py-5 text-center">
              <p className="text-sm font-semibold text-[#3041a1]">Seat map unavailable</p>
              <p className="mt-1 text-xs text-[#6f7cb6]">
                Choose a date/time with departures to view seats.
              </p>
            </div>
          )}
        </div>
      )}

      {step === "details" && (
        <div className="mt-3 space-y-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
          <div>
            <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
              Name
            </Label>
            <div className="relative">
              <Input
                value={form.passengerName}
                onChange={(event) => setForm((prev) => ({ ...prev, passengerName: event.target.value }))}
                className="h-8 border-[#d7dcf3] pr-8 text-xs text-[#27378f]"
                placeholder="John"
              />
              <UserRound className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-[#91a0dd]" />
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
              Place
            </Label>
            <Input
              value={form.pickupLocation}
              onChange={(event) => setForm((prev) => ({ ...prev, pickupLocation: event.target.value }))}
              className="h-8 border-[#d7dcf3] text-xs text-[#27378f]"
              placeholder="1 place2"
            />
          </div>

          <div>
            <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
              Phone
            </Label>
            <div className="relative">
              <Input
                value={form.passengerPhone}
                onChange={(event) => setForm((prev) => ({ ...prev, passengerPhone: event.target.value }))}
                className="h-8 border-[#d7dcf3] pr-8 text-xs text-[#27378f]"
                placeholder="123456789"
              />
              <Phone className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-[#91a0dd]" />
            </div>
          </div>

          <div className="rounded-lg border border-[#cdd4f3] bg-[#f7f9ff] p-2.5">
            <p className="text-[10px] font-semibold uppercase text-[#6f7cb6]">Booking Details</p>
            <p className="mt-1 text-[11px] font-semibold text-[#3041a1]">
              {route.from} - {route.to}
            </p>
            <p className="mt-0.5 text-[10px] text-[#6f7cb6]">{selectedDate}</p>
            <p className="mt-0.5 text-[10px] text-[#6f7cb6]">{selectedTimeslot?.time}</p>
            <p className="mt-0.5 text-[10px] text-[#6f7cb6]">
              {selectedSeatCount} seat{selectedSeatCount === 1 ? "" : "s"} ({totalPrice} THB)
            </p>
          </div>

          <div>
            <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
              Payment Method
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "cash", label: "Cash" },
                { value: "promptpay", label: "PromptPay" },
                { value: "bank_transfer", label: "Transfer" },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                  className={`h-8 rounded border text-[10px] font-semibold transition-colors ${
                    paymentMethod === method.value
                      ? "border-[#4f62d3] bg-[#edf1ff] text-[#3041a1]"
                      : "border-[#d7dcf3] bg-white text-[#6f7cb6]"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              className="h-8 border-[#d7dcf3] text-[11px] text-[#5f6ba6]"
              onClick={() => {
                void releaseLockedSeats();
                setStep("seats");
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="h-8 bg-[#3f53c9] text-[11px] hover:bg-[#3447b4]"
              onClick={submitBooking}
              disabled={
                submitting ||
                !form.passengerName ||
                !form.passengerPhone ||
                !form.pickupLocation
              }
            >
              {submitting
                ? "Confirming..."
                : paymentMethod === "cash"
                  ? "Confirm Booking"
                  : "Continue to Proof Upload"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
