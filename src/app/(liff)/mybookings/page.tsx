"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiffPageLoading } from "@/components/shared/loading";
import { LiffPageHeader } from "@/components/layout/liff-page-header";
import { useMyBookings } from "@/hooks/queries";

type Tab = "active" | "cancelled";

export default function MyBookingsPage() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const [tab, setTab] = useState<Tab>("active");

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) =>
      tab === "cancelled" ? booking.status === "cancelled" : booking.status !== "cancelled"
    );
  }, [bookings, tab]);

  return (
    <div className="px-4 pb-6 pt-3">
      <LiffPageHeader title="My Bookings" subtitle="Track active and cancelled trips" />

      <div className="rounded-xl border border-[#d6dcf4] bg-white p-2">
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

      {isLoading && <LiffPageLoading title="Loading bookings" subtitle="Syncing your latest trips..." />}

      {!isLoading && filteredBookings.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-[#cbd3f1] bg-white px-4 py-10 text-center">
          <p className="text-xs text-[#6e7ab4]">No bookings in this tab.</p>
          <Button asChild className="mt-3 h-8 bg-[#3f53c9] text-[11px] hover:bg-[#3447b4]">
            <Link href="/">Book now</Link>
          </Button>
        </div>
      )}

      <div className="mt-3 space-y-3">
        {filteredBookings.map((booking) => {
          const route = booking.routeId as { from: string; to: string } | undefined;
          const timeslot = booking.timeslotId as { date: string; time: string } | undefined;
          const seats = booking.seatIds as { label: string }[] | undefined;
          const payment = booking.paymentId as { status: string; method: string } | undefined;

          return (
            <article key={booking._id} className="rounded-xl border border-[#d6dcf4] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase text-[#7380ba]">
                {timeslot?.date || "-"}
              </p>

              <div className="mt-1 space-y-1 text-[11px]">
                <p className="inline-flex items-center gap-1.5 font-semibold text-[#2f3f9f]">
                  <MapPin className="h-3.5 w-3.5" />
                  {route ? `${route.from} - ${route.to}` : "-"}
                </p>
                <p className="inline-flex items-center gap-1.5 text-[#6f7cb6]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {timeslot?.date || "-"}
                </p>
                <p className="inline-flex items-center gap-1.5 text-[#6f7cb6]">
                  <Clock3 className="h-3.5 w-3.5" />
                  {timeslot?.time || "-"}
                </p>
                <p className="inline-flex items-center gap-1.5 text-[#6f7cb6]">
                  <UserRound className="h-3.5 w-3.5" />
                  {seats?.map((seat) => seat.label).join(", ") || "-"}
                </p>
                <p className="text-[10px] font-medium text-[#6f7cb6]">
                  Payment: {payment?.method || "-"} ({payment?.status || "-"})
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  asChild
                  className="h-7 rounded-md bg-[#4f62d3] px-3 text-[10px] font-semibold hover:bg-[#4054c5]"
                >
                  <Link href={`/editbooking/${booking._id}`}>DETAILS</Link>
                </Button>
                {payment?.status === "pending" && payment?.method !== "cash" && (
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
          );
        })}
      </div>
    </div>
  );
}
