import TimeSlot from "@/app/ui/timeslot/timeslot";
import NavBar from "@/app/ui/navbar/navbar";
import DestinationSelection from "@/app/ui/destination-selection/destination-selection";

export default function Home() {
  return (
    <main className="flex flex-col gap-10">
      <div className="flex justify-between items-center">
        <NavBar />
      </div>

      <div className="flex flex-col justify-center items-center h-full gap-5">
        <DestinationSelection />
      </div>
    </main>
  );
}
