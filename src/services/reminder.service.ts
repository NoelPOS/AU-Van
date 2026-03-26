import { connectDB } from "@/libs/mongodb";
import Booking from "@/models/Booking";
import ReminderJob from "@/models/ReminderJob";
import Timeslot from "@/models/Timeslot";
import User from "@/models/User";
import { notificationService } from "@/services/notification.service";

const MAX_REMINDER_ATTEMPTS = Number(process.env.REMINDER_MAX_ATTEMPTS || 5);
const REMINDER_SCHEDULE_MODE = process.env.REMINDER_SCHEDULE_MODE || "daily_batch";
const REMINDER_BATCH_HOUR_UTC = Math.min(
  23,
  Math.max(0, Number(process.env.REMINDER_BATCH_HOUR_UTC || 1))
);

function parseTimeslotDateTime(date: string, time: string): Date {
  const hhmm = /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const parsed = new Date(`${date}T${hhmm}:00`);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return new Date(`${date} ${time}`);
}

function buildReminderJobs(departureAt: Date) {
  if (REMINDER_SCHEDULE_MODE === "daily_batch") {
    const runAt = new Date(
      Date.UTC(
        departureAt.getUTCFullYear(),
        departureAt.getUTCMonth(),
        departureAt.getUTCDate(),
        REMINDER_BATCH_HOUR_UTC,
        0,
        0,
        0
      )
    );

    return [{ type: "departure_daily_batch" as const, runAt }];
  }

  return [
    { type: "departure_24h" as const, runAt: new Date(departureAt.getTime() - 24 * 60 * 60 * 1000) },
    { type: "departure_1h" as const, runAt: new Date(departureAt.getTime() - 60 * 60 * 1000) },
  ];
}

class ReminderService {
  private static instance: ReminderService;

  private constructor() {}

  static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  async scheduleForBooking(bookingId: string) {
    await connectDB();

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) return { queued: 0 };
    if (booking.status !== "confirmed") return { queued: 0 };

    const timeslot = await Timeslot.findById(booking.timeslotId).lean();
    if (!timeslot) return { queued: 0 };

    const user = await User.findById(booking.userId).lean();
    if (!user) return { queued: 0 };

    const departureAt = parseTimeslotDateTime(timeslot.date, timeslot.time);
    if (Number.isNaN(departureAt.getTime())) return { queued: 0 };

    const jobs = buildReminderJobs(departureAt);

    let queued = 0;
    for (const job of jobs) {
      if (job.runAt.getTime() <= Date.now()) continue;
      await ReminderJob.findOneAndUpdate(
        { bookingId: booking._id, type: job.type },
        {
          $set: {
            userId: booking.userId,
            lineUserId: user.lineUserId,
            runAt: job.runAt,
            status: "pending",
            attempts: 0,
            lastError: undefined,
            payload: {
              bookingId: String(booking._id),
              routeId: String(booking.routeId),
              timeslotId: String(booking.timeslotId),
              departureDate: timeslot.date,
              departureTime: timeslot.time,
              passengerName: booking.passengerName,
            },
          },
          $unset: { lockedAt: 1, sentAt: 1 },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      queued += 1;
    }

    return { queued };
  }

  async cancelForBooking(bookingId: string) {
    await connectDB();
    const result = await ReminderJob.updateMany(
      { bookingId, status: { $in: ["pending", "failed", "processing"] } },
      {
        $set: {
          status: "cancelled",
          lastError: "Booking no longer eligible for reminders.",
        },
      }
    );
    return { cancelled: result.modifiedCount };
  }

  async processDueReminders(limit = 20) {
    await connectDB();

    const processed: Array<{ jobId: string; status: "sent" | "failed"; error?: string }> = [];
    for (let i = 0; i < limit; i += 1) {
      const job = await ReminderJob.findOneAndUpdate(
        {
          status: { $in: ["pending", "failed"] },
          runAt: { $lte: new Date() },
          attempts: { $lt: MAX_REMINDER_ATTEMPTS },
        },
        {
          $set: { status: "processing", lockedAt: new Date() },
        },
        { sort: { runAt: 1 }, new: true }
      );

      if (!job) break;

      try {
        const payload = (job.payload || {}) as Record<string, unknown>;
        const departureDate = String(payload.departureDate || "");
        const departureTime = String(payload.departureTime || "");

        await notificationService.notifyUser(String(job.userId), {
          type: "seat_reminder",
          title:
            job.type === "departure_24h"
              ? "Trip Reminder: 24 hours left"
              : job.type === "departure_1h"
                ? "Trip Reminder: 1 hour left"
                : "Trip Reminder: departs today",
          message: `Your van trip departs on ${departureDate} at ${departureTime}.`,
          data: {
            bookingId: payload.bookingId,
            departureDate,
            departureTime,
            reminderType: job.type,
          },
        });

        job.status = "sent";
        job.sentAt = new Date();
        job.lockedAt = undefined;
        job.lastError = undefined;
        job.attempts += 1;
        await job.save();

        processed.push({ jobId: String(job._id), status: "sent" });
      } catch (error) {
        job.status = "failed";
        job.lockedAt = undefined;
        job.lastError = error instanceof Error ? error.message : "Reminder send failed";
        job.attempts += 1;
        await job.save();

        processed.push({
          jobId: String(job._id),
          status: "failed",
          error: job.lastError,
        });
      }
    }

    return {
      processedCount: processed.length,
      sentCount: processed.filter((job) => job.status === "sent").length,
      failedCount: processed.filter((job) => job.status === "failed").length,
      jobs: processed,
    };
  }
}

export const reminderService = ReminderService.getInstance();
