"use client";

const items = [
  { color: "bg-[#f4f7ff] border-[#ccd5fb]", label: "Available" },
  { color: "bg-[#3f53c9] border-[#3145b8]", label: "Selected" },
  { color: "bg-[#fff3dc] border-[#f2cc75]", label: "Locked" },
  { color: "bg-[#e6ebff] border-[#cdd5f8]", label: "Booked" },
];

export function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#5f6eb2]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-4 w-4 rounded border ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
