"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { CalendarDays, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiffPageLoading } from "@/components/shared/loading";
import { LiffPageHeader } from "@/components/layout/liff-page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IRoute, ITimeslot } from "@/types";

export function RouteScheduleScreen() {
  const { status } = useSession();
  const router = useRouter();

  const [routes, setRoutes] = useState<IRoute[]>([]);
  const [timeslots, setTimeslots] = useState<ITimeslot[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedTimeslotId, setSelectedTimeslotId] = useState("");
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingTimeslots, setLoadingTimeslots] = useState(false);
  const [error, setError] = useState("");

  const quickDates = useMemo(() => {
    const base = new Date();
    return [0, 1, 2].map((offset) => {
      const date = addDays(base, offset);
      return {
        value: date.toISOString().split("T")[0],
        label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : format(date, "EEE"),
      };
    });
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoadingRoutes(false);
      return;
    }

    setLoadingRoutes(true);
    setError("");

    fetch("/api/liff/routes")
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setError(json.error || "Failed to load routes");
          return;
        }

        const list: IRoute[] = json.data || [];
        setRoutes(list);
        if (list.length > 0) setSelectedRouteId(list[0]._id);
      })
      .catch(() => setError("Failed to load routes"))
      .finally(() => setLoadingRoutes(false));
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !selectedRouteId) return;

    setLoadingTimeslots(true);

    fetch(`/api/liff/timeslots?routeId=${selectedRouteId}&date=${selectedDate}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setTimeslots([]);
          setSelectedTimeslotId("");
          return;
        }

        const list: ITimeslot[] = json.data || [];
        setTimeslots(list);
        if (list.length > 0) setSelectedTimeslotId((prev) => prev || list[0]._id);
        else setSelectedTimeslotId("");
      })
      .catch(() => {
        setTimeslots([]);
        setSelectedTimeslotId("");
      })
      .finally(() => setLoadingTimeslots(false));
  }, [selectedRouteId, selectedDate, status]);

  const selectedRoute = useMemo(
    () => routes.find((route) => route._id === selectedRouteId),
    [routes, selectedRouteId]
  );

  if (status === "unauthenticated") {
    return <LiffPageLoading title="Waiting for LINE session" subtitle="Please complete login to continue booking." />;
  }

  if (loadingRoutes) {
    return <LiffPageLoading />;
  }

  return (
    <div className="px-4 pb-6 pt-3">
      <LiffPageHeader
        title="Choose Your Destination"
        subtitle="Pick route, date, and timeslot in one flow"
      />

      <header className="rounded-2xl bg-gradient-to-br from-[#4259ce] to-[#2f45b6] px-4 py-4 text-white shadow-[0_16px_30px_rgba(31,47,141,0.25)]">
        <p className="text-[11px] uppercase tracking-wide text-white/70">AU Van Booking</p>
        <h1 className="mt-1 text-base font-semibold">Choose your trip</h1>
        <p className="mt-1 text-[11px] text-white/80">Pick destination, date, and slot in under a minute.</p>
      </header>

      <section className="mt-4 rounded-2xl border border-[#d6dcf4] bg-white p-3 shadow-[0_8px_20px_rgba(57,85,194,0.06)]">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#7682bb]">
            Route
          </label>
          <Select value={selectedRouteId || undefined} onValueChange={setSelectedRouteId}>
            <SelectTrigger className="h-10 border-[#d9def4] text-xs text-[#22339a]">
              <SelectValue placeholder="Choose route" />
            </SelectTrigger>
            <SelectContent>
              {routes.length === 0 && (
                <SelectItem value="none" disabled>
                  No route available
                </SelectItem>
              )}
              {routes.map((route) => (
                <SelectItem key={route._id} value={route._id}>
                  {route.from} - {route.to}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#7682bb]">
            Date
          </label>
          <div className="grid grid-cols-3 gap-2">
            {quickDates.map((item) => {
              const active = selectedDate === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setSelectedDate(item.value)}
                  className={`h-8 rounded-md border text-[10px] font-semibold transition-colors ${
                    active
                      ? "border-[#4f62d3] bg-[#eaf0ff] text-[#2d40a6]"
                      : "border-[#d7ddf4] bg-white text-[#6f7cb6] hover:bg-[#f5f7ff]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="mt-2">
            <Input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-10 border-[#d9def4] text-xs text-[#22339a]"
            />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#d6dcf4] bg-white p-3 shadow-[0_8px_20px_rgba(57,85,194,0.06)]">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[#22339a]">Available Timeslots</p>
          <span className="text-[10px] text-[#7c88bf]">{format(new Date(selectedDate), "EEE, MMM d")}</span>
        </div>

        {error && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700">{error}</p>
        )}

        {loadingTimeslots && (
          <div className="space-y-2 py-2">
            <div className="h-14 animate-pulse rounded-xl border border-[#dbe2fb] bg-[#f4f7ff]" />
            <div className="h-14 animate-pulse rounded-xl border border-[#dbe2fb] bg-[#f4f7ff]" />
          </div>
        )}

        {!loadingTimeslots && !error && timeslots.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#cad3f1] bg-[#fbfcff] px-3 py-7 text-center">
            <CalendarDays className="mx-auto mb-2 h-5 w-5 text-[#98a5da]" />
            <p className="text-xs text-[#6f7cb6]">No slots on this day. Try another date.</p>
          </div>
        )}

        {!loadingTimeslots && timeslots.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {timeslots.map((timeslot) => {
              const availableSeats = timeslot.totalSeats - timeslot.bookedSeats;
              const active = selectedTimeslotId === timeslot._id;
              return (
                <button
                  key={timeslot._id}
                  onClick={() => setSelectedTimeslotId(timeslot._id)}
                  className={`rounded-xl border px-2 py-2 text-left transition-colors ${
                    active
                      ? "border-[#445bd0] bg-[#ecf1ff]"
                      : "border-[#e1e6f8] bg-[#fafbff] hover:border-[#c5cef0]"
                  }`}
                >
                  <p className="text-[12px] font-semibold text-[#2f3f9f]">{timeslot.time}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-[#6f7cb6]">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#57c088]" />
                      {availableSeats} seats
                    </span>
                    <span>{selectedRoute?.price || 0} THB</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <Button
        className="mt-4 h-11 w-full rounded-xl bg-[#3f53c9] text-xs font-semibold hover:bg-[#3447b4]"
        disabled={!selectedRouteId || !selectedTimeslotId}
        onClick={() => {
          const query = new URLSearchParams({
            date: selectedDate,
            timeslotId: selectedTimeslotId,
          });
          router.push(`/book/${selectedRouteId}?${query.toString()}`);
        }}
      >
        <span className="inline-flex items-center gap-1.5">
          <Ticket className="h-4 w-4" />
          Continue to Seat Selection
        </span>
      </Button>

      <p className="mt-2 text-center text-[10px] text-[#7d88bf]">
        Route:{" "}
        <span className="font-semibold text-[#5666b8]">
          {selectedRoute ? `${selectedRoute.from} to ${selectedRoute.to}` : "-"}
        </span>
      </p>
    </div>
  );
}
