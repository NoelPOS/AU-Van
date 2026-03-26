import { connectDB } from "@/libs/mongodb";
import Timeslot from "@/models/Timeslot";
import { seatService } from "./seat.service";
import type { CreateTimeslotInput, UpdateTimeslotInput } from "@/validators/timeslot.validator";

class TimeslotService {
  private static instance: TimeslotService;
  private constructor() {}

  static getInstance(): TimeslotService {
    if (!TimeslotService.instance) {
      TimeslotService.instance = new TimeslotService();
    }
    return TimeslotService.instance;
  }

  async getTimeslotsByRoute(routeId: string, date?: string) {
    await connectDB();
    const query: Record<string, unknown> = { routeId, status: { $ne: "cancelled" } };
    if (date) query.date = date;
    return Timeslot.find(query).populate("routeId", "from to slug price").sort({ date: 1, time: 1 }).lean();
  }

  async getTimeslotById(id: string) {
    await connectDB();
    return Timeslot.findById(id).populate("routeId", "from to slug price").lean();
  }

  async createTimeslot(input: CreateTimeslotInput) {
    await connectDB();
    const existing = await Timeslot.findOne({
      routeId: input.routeId,
      date: input.date,
      time: input.time,
    });
    if (existing) throw new Error("Timeslot already exists for this route, date and time");

    const timeslot = await Timeslot.create({
      routeId: input.routeId,
      date: input.date,
      time: input.time,
      totalSeats: input.totalSeats,
      bookedSeats: 0,
      status: "active",
    });

    await seatService.createSeatsForTimeslot(String(timeslot._id), input.totalSeats);
    return timeslot;
  }

  async updateTimeslot(id: string, updates: UpdateTimeslotInput) {
    await connectDB();
    const timeslot = await Timeslot.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!timeslot) throw new Error("Timeslot not found");
    return timeslot;
  }

  async cancelTimeslot(id: string) {
    await connectDB();
    const timeslot = await Timeslot.findByIdAndUpdate(id, { status: "cancelled" }, { new: true });
    if (!timeslot) throw new Error("Timeslot not found");
    return timeslot;
  }

  async getAvailableTimeslots(routeId: string, date: string) {
    await connectDB();
    return Timeslot.find({
      routeId,
      date,
      status: "active",
      $expr: { $lt: ["$bookedSeats", "$totalSeats"] },
    })
      .populate("routeId", "from to slug price")
      .sort({ time: 1 })
      .lean();
  }
}

export const timeslotService = TimeslotService.getInstance();
