"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    setLoading(true);
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
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !selectedRouteId) return;

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
        if (list.length > 0) setSelectedTimeslotId(list[0]._id);
        else setSelectedTimeslotId("");
      })
      .catch(() => {
        setTimeslots([]);
        setSelectedTimeslotId("");
      });
  }, [selectedRouteId, selectedDate, status]);

  const selectedRoute = useMemo(
    () => routes.find((route) => route._id === selectedRouteId),
    [routes, selectedRouteId]
  );

  if (status === "unauthenticated") {
    return (
      <div className="px-4 pb-8 pt-6">
        <div className="rounded-xl border border-[#d4daf2] bg-white p-5 text-center">
          <h1 className="text-base font-bold text-[#1f2f8d]">AU Van LIFF</h1>
          <p className="mt-2 text-xs text-[#6470a8]">
            Sign in to select your destination, time slot, and seat.
          </p>
          <Button className="mt-4 w-full bg-[#3f53c9] hover:bg-[#3447b4]" onClick={() => router.push("/auth")}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 pt-3">
      <h1 className="text-sm font-semibold text-[#1f2f8d]">Choose Your Destination</h1>

      <div className="mt-3 space-y-3 rounded-xl border border-[#d6dcf4] bg-white p-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
            From
          </label>
          <Input
            value={selectedRoute?.from || "Assumption University"}
            disabled
            className="h-8 border-[#d7dcf3] bg-[#f7f8fd] text-xs text-[#26368f]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
            To
          </label>
          <select
            value={selectedRouteId}
            onChange={(event) => setSelectedRouteId(event.target.value)}
            className="h-8 w-full rounded-md border border-[#d7dcf3] bg-white px-2 text-xs text-[#26368f] focus:outline-none focus:ring-1 focus:ring-[#3f53c9]"
          >
            {routes.map((route) => (
              <option key={route._id} value={route._id}>
                {route.to}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-[#7682bb]">
            Date
          </label>
          <div className="relative">
            <Input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-8 border-[#d7dcf3] text-xs text-[#26368f]"
            />
            <Calendar className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-[#8a96ce]" />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#d6dcf4] bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[#1f2f8d]">Available Timeslots</p>
          {selectedRoute && (
            <span className="text-[10px] text-[#7c88bf]">
              {selectedRoute.from} - {selectedRoute.to}
            </span>
          )}
        </div>

        {loading && <p className="py-4 text-center text-xs text-[#7d88bf]">Loading routes...</p>}
        {error && !loading && (
          <p className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-600">{error}</p>
        )}
        {!loading && !error && timeslots.length === 0 && (
          <p className="py-4 text-center text-xs text-[#7d88bf]">No timeslots available for this date.</p>
        )}

        {timeslots.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {timeslots.map((timeslot) => {
              const availableSeats = timeslot.totalSeats - timeslot.bookedSeats;
              const active = selectedTimeslotId === timeslot._id;
              return (
                <button
                  key={timeslot._id}
                  onClick={() => setSelectedTimeslotId(timeslot._id)}
                  className={`rounded-lg border px-2 py-2 text-left transition-colors ${
                    active
                      ? "border-[#3f53c9] bg-[#edf0fd]"
                      : "border-[#e2e6f8] bg-[#fafbff] hover:border-[#c7cff0]"
                  }`}
                >
                  <p className="text-[11px] font-semibold text-[#2f3f9f]">{timeslot.time}</p>
                  <div className="mt-1 space-y-0.5 text-[9px] text-[#7d88bf]">
                    <p className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#57c088]" />
                      {availableSeats} seats left
                    </p>
                    <p className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#f5b94a]" />
                      {selectedRoute?.price || 0} THB
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Button
        className="mt-4 h-9 w-full bg-[#3f53c9] text-xs hover:bg-[#3447b4]"
        disabled={!selectedRouteId || !selectedTimeslotId}
        onClick={() => {
          const query = new URLSearchParams({
            date: selectedDate,
            timeslotId: selectedTimeslotId,
          });
          router.push(`/book/${selectedRouteId}?${query.toString()}`);
        }}
      >
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          Continue to Seat Selection
        </span>
      </Button>

      <p className="mt-2 text-center text-[10px] text-[#7d88bf]">
        {format(new Date(selectedDate), "EEE, MMM d, yyyy")}
      </p>
    </div>
  );
}
