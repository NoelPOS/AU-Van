import NavBar from "@/app/ui/navbar/navbar";
import TimeSlot from "@/app/ui/timeslot/timeslot";

export default function Home() {
  const date = new Date();

  return (
    <main className="">
      <div className="flex justify-between items-center mb-10">
        <NavBar />
      </div>

      <div className="flex flex-col gap-5">
        <h3 className="text-2xl font-semibold text-black">
          {new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date)},{" "}
          {date.getDate()} {date.toLocaleString("default", { month: "long" })}{" "}
          {date.getFullYear()}
        </h3>
        <TimeSlot />
        <TimeSlot />
      </div>
    </main>
  );
}
