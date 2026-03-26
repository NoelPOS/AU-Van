"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { SeatMap } from "@/components/seats/seat-map";

interface BookingData {
  _id: string;
  passengerName: string;
  passengerPhone: string;
  pickupLocation: string;
  status: string;
  routeId?: { _id: string; from: string; to: string };
  timeslotId?: { _id: string; date: string; time: string };
  seatIds?: { _id?: string; label: string }[];
}

interface TimeslotOption {
  _id: string;
  date: string;
  time: string;
  totalSeats: number;
  bookedSeats: number;
}

export default function EditBookingPage() {
  const { bookingid } = useParams<{ bookingid: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [timeslots, setTimeslots] = useState<TimeslotOption[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [targetTimeslotId, setTargetTimeslotId] = useState("");
  const [targetSeatIds, setTargetSeatIds] = useState<string[]>([]);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    passengerName: "",
    pickupLocation: "",
    passengerPhone: "",
  });
  const isCancelled = booking?.status === "cancelled";
  const seatCount = useMemo(() => booking?.seatIds?.length || 1, [booking?.seatIds]);

  useEffect(() => {
    fetch(`/api/liff/bookings/${bookingid}`)
      .then((response) => response.json())
      .then((json) => {
        if (!json.success || !json.data) {
          setError("Booking not found");
          return;
        }
        const data: BookingData = json.data;
        setBooking(data);
        setRescheduleDate(data.timeslotId?.date || new Date().toISOString().split("T")[0]);
        setForm({
          passengerName: data.passengerName || "",
          pickupLocation: data.pickupLocation || "",
          passengerPhone: data.passengerPhone || "",
        });
      })
      .catch(() => setError("Failed to load booking"))
      .finally(() => setLoading(false));
  }, [bookingid]);

  useEffect(() => {
    if (!rescheduleMode || !booking?.routeId?._id) return;

    fetch(`/api/liff/timeslots?routeId=${booking.routeId._id}&date=${rescheduleDate}`)
      .then((response) => response.json())
      .then((json) => {
        if (!json.success) {
          setTimeslots([]);
          setTargetTimeslotId("");
          return;
        }
        const list: TimeslotOption[] = json.data || [];
        setTimeslots(list);
        const preferred =
          list.find((slot) => slot._id !== booking.timeslotId?._id)?._id ||
          list[0]?._id ||
          "";
        setTargetTimeslotId(preferred);
        setTargetSeatIds([]);
      })
      .catch(() => {
        setTimeslots([]);
        setTargetTimeslotId("");
      });
  }, [booking?.routeId?._id, booking?.timeslotId?._id, rescheduleDate, rescheduleMode]);

  const handleSaveDetails = async () => {
    if (!booking) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/liff/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!json.success) {
        setError(json.error || "Failed to update booking details");
        return;
      }
      setMessage("Passenger details updated.");
    } catch {
      setError("Failed to update booking details");
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async () => {
    if (!booking) return;
    if (!rescheduleMode) {
      setRescheduleMode(true);
      return;
    }
    if (!targetTimeslotId) {
      setError("Please choose a new timeslot.");
      return;
    }
    if (targetSeatIds.length !== seatCount) {
      setError(`Please choose exactly ${seatCount} seat${seatCount > 1 ? "s" : ""}.`);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/liff/bookings/${booking._id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeslotId: targetTimeslotId,
          seatIds: targetSeatIds,
        }),
      });
      const json = await response.json();
      if (!json.success) {
        setError(json.error || "Failed to reschedule booking");
        return;
      }
      setMessage("Reschedule request submitted.");
      setTimeout(() => router.push("/mybookings"), 1200);
    } catch {
      setError("Failed to reschedule booking");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/liff/bookings/${booking._id}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (!json.success) {
        setError(json.error || "Failed to cancel booking");
        return;
      }
      setMessage("Booking cancelled.");
      setTimeout(() => router.push("/mybookings"), 900);
    } catch {
      setError("Failed to cancel booking");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="px-4 py-8 text-center text-xs text-[#6e7ab4]">Loading booking details...</p>;
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
      <h1 className="text-sm font-semibold text-[#1f2f8d]">Reschedule Booking</h1>

      <div className="mt-3 space-y-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
        <div>
          <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">Name</Label>
          <Input
            value={form.passengerName}
            onChange={(event) => setForm((prev) => ({ ...prev, passengerName: event.target.value }))}
            className="h-8 border-[#d7dcf3] text-xs text-[#27378f]"
            placeholder="John"
          />
        </div>

        <div>
          <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">Place</Label>
          <Input
            value={form.pickupLocation}
            onChange={(event) => setForm((prev) => ({ ...prev, pickupLocation: event.target.value }))}
            className="h-8 border-[#d7dcf3] text-xs text-[#27378f]"
            placeholder="1 place2"
          />
        </div>

        <div>
          <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">Phone</Label>
          <Input
            value={form.passengerPhone}
            onChange={(event) => setForm((prev) => ({ ...prev, passengerPhone: event.target.value }))}
            className="h-8 border-[#d7dcf3] text-xs text-[#27378f]"
            placeholder="123456789"
          />
        </div>

        <div className="rounded-lg border border-[#cdd4f3] bg-[#f7f9ff] p-2.5">
          <p className="text-[10px] font-semibold uppercase text-[#6f7cb6]">Booking Details</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3041a1]">
            <MapPin className="h-3.5 w-3.5" />
            {booking.routeId ? `${booking.routeId.from} - ${booking.routeId.to}` : "-"}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] text-[#6f7cb6]">
            <CalendarDays className="h-3.5 w-3.5" />
            {booking.timeslotId?.date || "-"}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] text-[#6f7cb6]">
            <Clock3 className="h-3.5 w-3.5" />
            {booking.timeslotId?.time || "-"}
          </p>
          <p className="mt-0.5 text-[10px] text-[#6f7cb6]">
            {booking.seatIds?.map((seat) => seat.label).join(", ") || "-"}
          </p>
        </div>

        <Button
          variant="outline"
          className="h-7 w-full border-[#cbd3f1] text-[10px] text-[#3142a5] hover:bg-[#f2f5ff]"
          onClick={() => setRescheduleMode((prev) => !prev)}
          disabled={saving || isCancelled}
        >
          {rescheduleMode ? "HIDE RESCHEDULE OPTIONS" : "SHOW RESCHEDULE OPTIONS"}
        </Button>

        {rescheduleMode && (
          <div className="space-y-2 rounded-lg border border-[#cdd4f3] bg-[#f8faff] p-2.5">
            <div>
              <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
                New Date
              </Label>
              <Input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => setRescheduleDate(event.target.value)}
                className="h-8 border-[#d7dcf3] text-xs text-[#27378f]"
              />
            </div>

            <div>
              <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
                New Timeslot
              </Label>
              <select
                value={targetTimeslotId}
                onChange={(event) => {
                  setTargetTimeslotId(event.target.value);
                  setTargetSeatIds([]);
                }}
                className="h-8 w-full rounded-md border border-[#d7dcf3] bg-white px-2 text-xs text-[#26368f] focus:outline-none focus:ring-1 focus:ring-[#3f53c9]"
              >
                <option value="">Select timeslot</option>
                {timeslots.map((slot) => (
                  <option key={slot._id} value={slot._id}>
                    {slot.time} ({slot.totalSeats - slot.bookedSeats} left)
                  </option>
                ))}
              </select>
            </div>

            {targetTimeslotId && (
              <div className="rounded-lg border border-[#d7dcf3] bg-white p-2">
                <SeatMap
                  timeslotId={targetTimeslotId}
                  selectedSeats={targetSeatIds}
                  onSelectionChange={setTargetSeatIds}
                  maxSeats={seatCount}
                />
                <p className="mt-1 text-center text-[10px] text-[#6f7cb6]">
                  Choose {seatCount} seat{seatCount > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-600">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-700">
            {message}
          </p>
        )}

        <Button
          variant="outline"
          className="h-8 w-full border-red-300 text-[11px] text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleCancelBooking}
          disabled={saving || isCancelled}
        >
          {isCancelled ? "BOOKING CANCELLED" : "CANCEL BOOKING"}
        </Button>
        <Button
          variant="outline"
          className="h-8 w-full border-[#cbd3f1] text-[11px] text-[#3142a5] hover:bg-[#f2f5ff]"
          onClick={handleSaveDetails}
          disabled={saving || isCancelled}
        >
          {saving ? "Processing..." : "SAVE DETAILS"}
        </Button>
        <Button
          className="h-8 w-full bg-[#3f53c9] text-[11px] hover:bg-[#3447b4]"
          onClick={handleReschedule}
          disabled={saving || isCancelled}
        >
          {saving ? "Processing..." : "RESCHEDULE"}
        </Button>
      </div>
    </div>
  );
}
