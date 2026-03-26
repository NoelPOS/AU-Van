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
    "flex h-9 w-9 items-center justify-center rounded-md text-[10px] font-semibold transition-all cursor-pointer border ";

  if (isBooked) {
    className += "bg-[#e9ecf7] border-[#d8ddf0] text-[#a4acd0] cursor-not-allowed";
  } else if (isSelected) {
    className += "bg-[#4f62d3] border-[#4f62d3] text-white shadow-sm";
  } else if (isLocked) {
    className += "bg-[#fff6e0] border-[#f4cf77] text-[#bf8d12] cursor-not-allowed";
  } else if (isAvailable && !disabled) {
    className += "bg-[#f5f7ff] border-[#d9ddf3] text-[#4f62d3] hover:bg-[#ebefff]";
  } else {
    className += "bg-[#eceff8] border-[#dde2f2] text-[#a3abd1] cursor-not-allowed";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isBooked || isLocked}
      className={className}
      title={`Seat ${seat.label} - ${seat.status}`}
    >
      {seat.label}
    </button>
  );
}
