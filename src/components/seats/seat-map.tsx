"use client";

import { useState, useEffect, useCallback } from "react";
import { useSSE } from "@/hooks/use-sse";
import { SeatItem } from "./seat-item";
import { SeatLegend } from "./seat-legend";
import { LoadingSpinner } from "@/components/shared/loading";
import type { ISeat } from "@/types";

interface SeatMapProps {
  timeslotId: string;
  selectedSeats: string[];
  onSelectionChange: (seatIds: string[]) => void;
  maxSeats?: number;
  disabled?: boolean;
}

export function SeatMap({
  timeslotId,
  selectedSeats,
  onSelectionChange,
  maxSeats = 4,
  disabled = false,
}: SeatMapProps) {
  const [seats, setSeats] = useState<ISeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSeats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/seats/${timeslotId}`);
      const json = await res.json();
      if (json.success) {
        setSeats(Array.isArray(json.data) ? json.data : []);
        setError("");
      } else {
        setError(json.error || "Failed to load seats");
      }
    } catch {
      setError("Failed to load seats");
    } finally {
      setLoading(false);
    }
  }, [timeslotId]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  useSSE(
    "/api/notifications/sse",
    {
      seat_update: (data: unknown) => {
        const update = data as { timeslotId: string; seats: ISeat[] };
        if (update.timeslotId === timeslotId) {
          setSeats(update.seats);
        }
      },
    },
    true
  );

  const toggleSeat = (seatId: string) => {
    if (disabled) return;
    const seat = seats.find((s) => s._id === seatId);
    if (!seat || seat.status === "booked") return;

    if (selectedSeats.includes(seatId)) {
      onSelectionChange(selectedSeats.filter((id) => id !== seatId));
    } else if (selectedSeats.length < maxSeats) {
      onSelectionChange([...selectedSeats, seatId]);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-sm text-destructive">{error}</p>;
  if (seats.length === 0) {
    return (
      <div className="w-full rounded-xl border border-[#d6dcf4] bg-white px-4 py-5 text-center">
        <p className="text-sm font-semibold text-[#3041a1]">No seat layout yet</p>
        <p className="mt-1 text-xs text-[#6f7cb6]">
          This timeslot has no seats configured. Please choose another timeslot.
        </p>
      </div>
    );
  }

  const rows: ISeat[][] = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  const availableSeats = seats.filter((seat) => seat.status === "available").length;
  const lockedSeats = seats.filter((seat) => seat.status === "locked").length;
  const bookedSeats = seats.filter((seat) => seat.status === "booked").length;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="relative w-full rounded-xl border border-[#d6dcf4] bg-[#fbfcff] p-3.5">
        <div className="mb-3 flex items-center justify-between text-[11px]">
          <span className="rounded bg-[#e9edfd] px-2 py-0.5 font-semibold text-[#3f53c9]">
            Choose Seat
          </span>
          <span className="text-[#6f7cb6]">Pick up to {maxSeats}</span>
        </div>

        <div className="mb-3 rounded-lg border border-[#d9e0f8] bg-white px-3 py-1.5 text-center text-[10px] font-semibold text-[#5262ad]">
          Front (Driver)
        </div>

        <div className="flex flex-col gap-2.5">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center justify-center gap-3">
              <div className="flex gap-2">
                {row.slice(0, 2).map((seat) => (
                  <SeatItem
                    key={seat._id}
                    seat={seat}
                    isSelected={selectedSeats.includes(seat._id)}
                    onClick={() => toggleSeat(seat._id)}
                    disabled={disabled}
                  />
                ))}
              </div>
              <div className="h-[2px] w-7 rounded-full bg-[#d6dcf4]" />
              <div className="flex gap-2">
                {row.slice(2, 4).map((seat) => (
                  <SeatItem
                    key={seat._id}
                    seat={seat}
                    isSelected={selectedSeats.includes(seat._id)}
                    onClick={() => toggleSeat(seat._id)}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid w-full grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-[#d8dff8] bg-[#f4f7ff] px-2 py-1.5">
          <p className="text-[11px] font-semibold text-[#3145b8]">{availableSeats}</p>
          <p className="text-[10px] text-[#6f7cb6]">Available</p>
        </div>
        <div className="rounded-lg border border-[#f2dca4] bg-[#fff6e3] px-2 py-1.5">
          <p className="text-[11px] font-semibold text-[#ac7d0c]">{lockedSeats}</p>
          <p className="text-[10px] text-[#8f7328]">Locked</p>
        </div>
        <div className="rounded-lg border border-[#d8dff8] bg-[#e9edff] px-2 py-1.5">
          <p className="text-[11px] font-semibold text-[#6b78b6]">{bookedSeats}</p>
          <p className="text-[10px] text-[#6f7cb6]">Booked</p>
        </div>
      </div>

      <SeatLegend />

      <p className="text-xs font-semibold text-[#3041a1]">
        {selectedSeats.length}
        <span className="font-normal text-[#6f7cb6]">/{maxSeats} seats selected</span>
      </p>
    </div>
  );
}
