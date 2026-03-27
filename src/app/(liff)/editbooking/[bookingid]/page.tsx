"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { SeatMap } from "@/components/seats/seat-map";
import { LiffPageLoading } from "@/components/shared/loading";
import { LiffPageHeader } from "@/components/layout/liff-page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBooking,
  useUpdateBooking,
  useRescheduleBooking,
  useCancelBooking,
  useTimeslots,
} from "@/hooks/queries";

export default function EditBookingPage() {
  const { bookingid } = useParams<{ bookingid: string }>();
  const router = useRouter();

  const { data: booking, isLoading } = useBooking(bookingid);
  const updateBooking = useUpdateBooking();
  const rescheduleBooking = useRescheduleBooking();
  const cancelBooking = useCancelBooking();

  const routeData = booking?.routeId as { _id: string; from: string; to: string } | undefined;
  const timeslotData = booking?.timeslotId as { _id: string; date: string; time: string } | undefined;
  const seatData = booking?.seatIds as { _id?: string; label: string }[] | undefined;

  const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split("T")[0]);
  const [targetTimeslotId, setTargetTimeslotId] = useState("");
  const [targetSeatIds, setTargetSeatIds] = useState<string[]>([]);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    passengerName: "",
    pickupLocation: "",
    passengerPhone: "",
  });
  const [initialized, setInitialized] = useState(false);

  const isCancelled = booking?.status === "cancelled";
  const seatCount = useMemo(() => seatData?.length || 1, [seatData]);

  // Initialize form when booking loads
  if (booking && !initialized) {
    setForm({
      passengerName: booking.passengerName || "",
      pickupLocation: booking.pickupLocation || "",
      passengerPhone: booking.passengerPhone || "",
    });
    setRescheduleDate(timeslotData?.date || new Date().toISOString().split("T")[0]);
    setInitialized(true);
  }

  // Load timeslots for reschedule
  const { data: timeslots = [] } = useTimeslots(
    rescheduleMode && routeData?._id ? routeData._id : "",
    rescheduleDate
  );

  // Auto-select timeslot when timeslots load in reschedule mode
  useEffect(() => {
    if (!rescheduleMode || timeslots.length === 0) return;
    const preferred =
      timeslots.find((slot) => slot._id !== timeslotData?._id)?._id ||
      timeslots[0]?._id ||
      "";
    setTargetTimeslotId(preferred);
    setTargetSeatIds([]);
  }, [timeslots, rescheduleMode, timeslotData?._id]);

  const saving = updateBooking.isPending || rescheduleBooking.isPending || cancelBooking.isPending;

  const showMsg = (type: "success" | "error", text: string) => {
    if (type === "success") {
      setMessage(text);
      setError("");
    } else {
      setError(text);
      setMessage("");
    }
  };

  const handleSaveDetails = async () => {
    if (!booking) return;
    setError("");
    setMessage("");
    try {
      await updateBooking.mutateAsync({ id: booking._id, ...form });
      showMsg("success", "Passenger details updated.");
    } catch (err) {
      showMsg("error", err instanceof Error ? err.message : "Failed to update booking details");
    }
  };

  const handleReschedule = async () => {
    if (!booking) return;
    if (!rescheduleMode) {
      setRescheduleMode(true);
      return;
    }
    if (!targetTimeslotId) {
      showMsg("error", "Please choose a new timeslot.");
      return;
    }
    if (targetSeatIds.length !== seatCount) {
      showMsg("error", `Please choose exactly ${seatCount} seat${seatCount > 1 ? "s" : ""}.`);
      return;
    }
    setError("");
    setMessage("");
    try {
      await rescheduleBooking.mutateAsync({
        id: booking._id,
        timeslotId: targetTimeslotId,
        seatIds: targetSeatIds,
      });
      showMsg("success", "Reschedule request submitted.");
      setTimeout(() => router.push("/mybookings"), 1200);
    } catch (err) {
      showMsg("error", err instanceof Error ? err.message : "Failed to reschedule booking");
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    setError("");
    setMessage("");
    try {
      await cancelBooking.mutateAsync(booking._id);
      showMsg("success", "Booking cancelled.");
      setTimeout(() => router.push("/mybookings"), 900);
    } catch (err) {
      showMsg("error", err instanceof Error ? err.message : "Failed to cancel booking");
    }
  };

  if (isLoading) {
    return <LiffPageLoading title="Loading booking details" subtitle="Preparing your current trip info..." />;
  }

  if (!booking) {
    return (
      <div className="px-4 py-8">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {error || "Booking not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 pt-3">
      <LiffPageHeader
        title="Edit Booking"
        subtitle="Update passenger details and reschedule seats"
        showBack
        backHref="/mybookings"
      />

      <div className="space-y-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
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
            {routeData ? `${routeData.from} - ${routeData.to}` : "-"}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] text-[#6f7cb6]">
            <CalendarDays className="h-3.5 w-3.5" />
            {timeslotData?.date || "-"}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] text-[#6f7cb6]">
            <Clock3 className="h-3.5 w-3.5" />
            {timeslotData?.time || "-"}
          </p>
          <p className="mt-0.5 text-[10px] text-[#6f7cb6]">
            {seatData?.map((seat) => seat.label).join(", ") || "-"}
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
              <Select
                value={targetTimeslotId || undefined}
                onValueChange={(value) => {
                  setTargetTimeslotId(value);
                  setTargetSeatIds([]);
                }}
              >
                <SelectTrigger className="h-8 border-[#d7dcf3] text-xs text-[#26368f]">
                  <SelectValue placeholder="Select timeslot" />
                </SelectTrigger>
                <SelectContent>
                  {timeslots.map((slot) => (
                    <SelectItem key={slot._id} value={slot._id}>
                      {slot.time} ({slot.totalSeats - slot.bookedSeats} left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700">
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
