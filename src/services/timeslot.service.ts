import Timeslot from "@/models/Timeslot";
import { seatService } from "./seat.service";
import type { CreateTimeslotInput, UpdateTimeslotInput, BulkCreateTimeslotInput } from "@/validators/timeslot.validator";

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

    const query: Record<string, unknown> = { routeId, status: { $ne: "cancelled" } };
    if (date) query.date = date;
    return Timeslot.find(query).populate("routeId", "from to slug price").sort({ date: 1, time: 1 }).lean();
  }

  async getTimeslotById(id: string) {

    return Timeslot.findById(id).populate("routeId", "from to slug price").lean();
  }

  async createTimeslot(input: CreateTimeslotInput) {

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

    const timeslot = await Timeslot.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!timeslot) throw new Error("Timeslot not found");
    return timeslot;
  }

  async cancelTimeslot(id: string) {

    const timeslot = await Timeslot.findByIdAndUpdate(id, { status: "cancelled" }, { new: true });
    if (!timeslot) throw new Error("Timeslot not found");
    return timeslot;
  }

  async getAvailableTimeslots(routeId: string, date: string) {

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

  async getTimeslotsByRoutePaginated(routeId: string, page: number, limit: number) {
    const query: Record<string, unknown> = { routeId, status: { $ne: "cancelled" } };
    const [data, total] = await Promise.all([
      Timeslot.find(query)
        .populate("routeId", "from to slug price")
        .sort({ date: 1, time: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Timeslot.countDocuments(query),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async bulkCreateTimeslots(input: BulkCreateTimeslotInput) {
    // Generate all dates in range matching selected days of week (UTC to avoid timezone drift)
    const [fy, fm, fd] = input.dateFrom.split("-").map(Number);
    const [ty, tm, td] = input.dateTo.split("-").map(Number);
    const current = new Date(Date.UTC(fy, fm - 1, fd));
    const end = new Date(Date.UTC(ty, tm - 1, td));

    const dates: string[] = [];
    while (current <= end) {
      if (input.daysOfWeek.includes(current.getUTCDay())) {
        const y = current.getUTCFullYear();
        const m = String(current.getUTCMonth() + 1).padStart(2, "0");
        const d = String(current.getUTCDate()).padStart(2, "0");
        dates.push(`${y}-${m}-${d}`);
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    let created = 0;
    let skipped = 0;

    for (const date of dates) {
      for (const time of input.times) {
        const existing = await Timeslot.findOne({ routeId: input.routeId, date, time });
        if (existing) {
          skipped++;
          continue;
        }
        const timeslot = await Timeslot.create({
          routeId: input.routeId,
          date,
          time,
          totalSeats: input.totalSeats,
          bookedSeats: 0,
          status: "active",
        });
        await seatService.createSeatsForTimeslot(String(timeslot._id), input.totalSeats);
        created++;
      }
    }

    return { created, skipped };
  }
}

export const timeslotService = TimeslotService.getInstance();
