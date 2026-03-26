import { connectDB } from "@/libs/mongodb";
import Seat from "@/models/Seat";
import Timeslot from "@/models/Timeslot";
import { sseManager } from "@/lib/sse";

const SEAT_LOCK_TIMEOUT_MS = Number(process.env.SEAT_LOCK_TIMEOUT_MS) || 300000;

// Seat label generator: 1A, 1B, 1C, 1D, 2A, ...
function generateSeatLabel(index: number): string {
  const row = Math.floor(index / 4) + 1;
  const col = String.fromCharCode(65 + (index % 4));
  return `${row}${col}`;
}

class SeatService {
  private static instance: SeatService;

  private constructor() {}

  static getInstance(): SeatService {
    if (!SeatService.instance) {
      SeatService.instance = new SeatService();
    }
    return SeatService.instance;
  }

  async createSeatsForTimeslot(timeslotId: string, totalSeats: number) {
    await connectDB();

    const seats = Array.from({ length: totalSeats }, (_, i) => ({
      timeslotId,
      seatNumber: i + 1,
      label: generateSeatLabel(i),
      status: "available" as const,
    }));

    return Seat.insertMany(seats);
  }

  async getSeatsForTimeslot(timeslotId: string) {
    await connectDB();
    // Release expired locks first
    await this.releaseExpiredLocks();

    return Seat.find({ timeslotId })
      .sort({ seatNumber: 1 })
      .select("-__v")
      .lean();
  }

  async lockSeats(timeslotId: string, seatIds: string[], userId: string) {
    await connectDB();
    await this.releaseExpiredLocks();

    // Verify all seats are available
    const seats = await Seat.find({
      _id: { $in: seatIds },
      timeslotId,
      status: "available",
    });

    if (seats.length !== seatIds.length) {
      const unavailable = seatIds.filter(
        (id) => !seats.find((s) => String(s._id) === id)
      );
      throw new Error(`Seats not available: ${unavailable.join(", ")}`);
    }

    // Lock the seats atomically
    const result = await Seat.updateMany(
      { _id: { $in: seatIds }, timeslotId, status: "available" },
      { $set: { status: "locked", lockedBy: userId, lockedAt: new Date() } }
    );

    if (result.modifiedCount !== seatIds.length) {
      // Race condition — rollback
      await Seat.updateMany(
        { _id: { $in: seatIds }, lockedBy: userId },
        { $set: { status: "available" }, $unset: { lockedBy: 1, lockedAt: 1 } }
      );
      throw new Error("Failed to lock seats — they may have been taken");
    }

    // Broadcast seat update via SSE
    this.broadcastSeatUpdate(timeslotId);

    return Seat.find({ _id: { $in: seatIds } }).lean();
  }

  async releaseSeats(seatIds: string[], userId: string) {
    await connectDB();

    await Seat.updateMany(
      { _id: { $in: seatIds }, lockedBy: userId, status: "locked" },
      { $set: { status: "available" }, $unset: { lockedBy: 1, lockedAt: 1 } }
    );

    if (seatIds.length > 0) {
      const seat = await Seat.findById(seatIds[0]);
      if (seat) this.broadcastSeatUpdate(String(seat.timeslotId));
    }
  }

  async confirmSeats(seatIds: string[], userId: string) {
    await connectDB();

    const result = await Seat.updateMany(
      { _id: { $in: seatIds }, lockedBy: userId, status: "locked" },
      {
        $set: { status: "booked", bookedBy: userId },
        $unset: { lockedBy: 1, lockedAt: 1 },
      }
    );

    // Update timeslot booked count
    if (result.modifiedCount > 0 && seatIds.length > 0) {
      const seat = await Seat.findById(seatIds[0]);
      if (seat) {
        await Timeslot.findByIdAndUpdate(seat.timeslotId, {
          $inc: { bookedSeats: result.modifiedCount },
        });

        // Check if timeslot is now full
        const timeslot = await Timeslot.findById(seat.timeslotId);
        if (timeslot && timeslot.bookedSeats >= timeslot.totalSeats) {
          await Timeslot.findByIdAndUpdate(seat.timeslotId, { status: "full" });
        }

        this.broadcastSeatUpdate(String(seat.timeslotId));
      }
    }

    return result;
  }

  async freeSeats(seatIds: string[]) {
    await connectDB();

    if (seatIds.length === 0) return;

    const firstSeat = await Seat.findById(seatIds[0]);

    await Seat.updateMany(
      { _id: { $in: seatIds } },
      {
        $set: { status: "available" },
        $unset: { lockedBy: 1, lockedAt: 1, bookedBy: 1 },
      }
    );

    // Decrement timeslot booked count
    if (firstSeat) {
      await Timeslot.findByIdAndUpdate(firstSeat.timeslotId, {
        $inc: { bookedSeats: -seatIds.length },
      });

      // Reactivate timeslot if it was full
      const timeslot = await Timeslot.findById(firstSeat.timeslotId);
      if (timeslot && timeslot.status === "full") {
        await Timeslot.findByIdAndUpdate(firstSeat.timeslotId, { status: "active" });
      }

      this.broadcastSeatUpdate(String(firstSeat.timeslotId));
    }
  }

  async releaseExpiredLocks() {
    const cutoff = new Date(Date.now() - SEAT_LOCK_TIMEOUT_MS);
    return Seat.updateMany(
      { status: "locked", lockedAt: { $lt: cutoff } },
      { $set: { status: "available" }, $unset: { lockedBy: 1, lockedAt: 1 } }
    );
  }

  private async broadcastSeatUpdate(timeslotId: string) {
    const seats = await Seat.find({ timeslotId })
      .sort({ seatNumber: 1 })
      .select("seatNumber label status")
      .lean();

    sseManager.broadcast("seat_update", { timeslotId, seats });
  }
}

export const seatService = SeatService.getInstance();
