"use client";

const items = [
  { color: "bg-[#f5f7ff] border-[#d9ddf3]", label: "Available" },
  { color: "bg-[#4f62d3] border-[#4f62d3]", label: "Selected" },
  { color: "bg-[#fff6e0] border-[#f4cf77]", label: "Locked" },
  { color: "bg-[#e9ecf7] border-[#d8ddf0]", label: "Booked" },
];

export function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-[#6f7cb6]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-3.5 w-3.5 rounded-sm border ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
