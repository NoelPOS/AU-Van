"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiffPageLoading } from "@/components/shared/loading";

interface BookingRow {
  _id: string;
  passengerName: string;
  status: string;
  routeId?: { from: string; to: string };
  timeslotId?: { date: string; time: string };
  seatIds?: { label: string }[];
  paymentId?: { status: string; method: string };
}

type Tab = "active" | "cancelled";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [tab, setTab] = useState<Tab>("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/liff/bookings")
      .then((response) => response.json())
      .then((json) => {
        if (json.success) setBookings(json.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) =>
      tab === "cancelled" ? booking.status === "cancelled" : booking.status !== "cancelled"
    );
  }, [bookings, tab]);

  return (
    <div className="px-4 pb-6 pt-3">
      <h1 className="text-sm font-semibold text-[#1f2f8d]">My Bookings</h1>

      <div className="mt-3 rounded-xl border border-[#d6dcf4] bg-white p-2">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setTab("active")}
            className={`h-7 rounded-md text-[10px] font-semibold transition-colors ${
              tab === "active"
                ? "bg-[#4f62d3] text-white"
                : "bg-[#eef1fa] text-[#6571a9] hover:bg-[#e5eaf8]"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setTab("cancelled")}
            className={`h-7 rounded-md text-[10px] font-semibold transition-colors ${
              tab === "cancelled"
                ? "bg-[#4f62d3] text-white"
                : "bg-[#eef1fa] text-[#6571a9] hover:bg-[#e5eaf8]"
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {loading && <LiffPageLoading title="Loading bookings" subtitle="Syncing your latest trips..." />}

      {!loading && filteredBookings.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-[#cbd3f1] bg-white px-4 py-10 text-center">
          <p className="text-xs text-[#6e7ab4]">No bookings in this tab.</p>
          <Button asChild className="mt-3 h-8 bg-[#3f53c9] text-[11px] hover:bg-[#3447b4]">
            <Link href="/">Book now</Link>
          </Button>
        </div>
      )}

      <div className="mt-3 space-y-3">
        {filteredBookings.map((booking) => (
          <article key={booking._id} className="rounded-xl border border-[#d6dcf4] bg-white p-3">
            <p className="text-[10px] font-semibold uppercase text-[#7380ba]">
              {booking.timeslotId?.date || "-"}
            </p>

            <div className="mt-1 space-y-1 text-[11px]">
              <p className="inline-flex items-center gap-1.5 font-semibold text-[#2f3f9f]">
                <MapPin className="h-3.5 w-3.5" />
                {booking.routeId ? `${booking.routeId.from} - ${booking.routeId.to}` : "-"}
              </p>
              <p className="inline-flex items-center gap-1.5 text-[#6f7cb6]">
                <CalendarDays className="h-3.5 w-3.5" />
                {booking.timeslotId?.date || "-"}
              </p>
              <p className="inline-flex items-center gap-1.5 text-[#6f7cb6]">
                <Clock3 className="h-3.5 w-3.5" />
                {booking.timeslotId?.time || "-"}
              </p>
              <p className="inline-flex items-center gap-1.5 text-[#6f7cb6]">
                <UserRound className="h-3.5 w-3.5" />
                {booking.seatIds?.map((seat) => seat.label).join(", ") || "-"}
              </p>
              <p className="text-[10px] font-medium text-[#6f7cb6]">
                Payment: {booking.paymentId?.method || "-"} ({booking.paymentId?.status || "-"})
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                asChild
                className="h-7 rounded-md bg-[#4f62d3] px-3 text-[10px] font-semibold hover:bg-[#4054c5]"
              >
                <Link href={`/editbooking/${booking._id}`}>DETAILS</Link>
              </Button>
              {booking.paymentId?.status === "pending" && booking.paymentId?.method !== "cash" && (
                <Button
                  asChild
                  variant="outline"
                  className="h-7 rounded-md border-[#c9d1f3] px-3 text-[10px] font-semibold text-[#3041a1] hover:bg-[#edf1ff]"
                >
                  <Link href={`/payment/${booking._id}`}>UPLOAD PROOF</Link>
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
