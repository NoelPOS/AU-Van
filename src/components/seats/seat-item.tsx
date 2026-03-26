"use client";

import type { ISeat } from "@/types";

interface SeatItemProps {
  seat: ISeat;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}

export function SeatItem({ seat, isSelected, onClick, disabled }: SeatItemProps) {
  const isBooked = seat.status === "booked";
  const isLocked = seat.status === "locked";
  const isAvailable = seat.status === "available";

  let className =
    "flex h-11 w-11 items-center justify-center rounded-lg text-xs font-semibold transition-all border ";

  if (isBooked) {
    className += "bg-[#e6ebff] border-[#cdd5f8] text-[#7f8ec9] cursor-not-allowed";
  } else if (isSelected) {
    className += "bg-[#3f53c9] border-[#3145b8] text-white shadow-md ring-2 ring-[#cfd8ff]";
  } else if (isLocked) {
    className += "bg-[#fff3dc] border-[#f2cc75] text-[#ac7d0c] cursor-not-allowed";
  } else if (isAvailable && !disabled) {
    className += "bg-[#f4f7ff] border-[#ccd5fb] text-[#3145b8] hover:bg-[#eaf0ff] active:scale-[0.98] cursor-pointer";
  } else {
    className += "bg-[#eceff8] border-[#dde2f2] text-[#9ba5cd] cursor-not-allowed";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isBooked || isLocked}
      className={className}
      aria-label={`Seat ${seat.label} (${seat.status})`}
      title={`Seat ${seat.label} - ${seat.status}`}
    >
      {seat.label}
    </button>
  );
}
