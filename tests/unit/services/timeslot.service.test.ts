import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/models/Timeslot", () => {
  const mockTimeslot = {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
  };
  return { default: mockTimeslot };
});

vi.mock("@/models/Booking", () => ({
  default: { countDocuments: vi.fn() },
}));

vi.mock("@/services/seat.service", () => ({
  seatService: {
    createSeatsForTimeslot: vi.fn().mockResolvedValue(undefined),
  },
}));

import Timeslot from "@/models/Timeslot";
import Booking from "@/models/Booking";
import { seatService } from "@/services/seat.service";
import { timeslotService } from "@/services/timeslot.service";

describe("TimeslotService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── cancelTimeslot ───────────────────────────────────────────────────────

  describe("cancelTimeslot", () => {
    it("throws when active bookings exist on the timeslot", async () => {
      vi.mocked(Booking.countDocuments).mockResolvedValue(3 as never);

      await expect(timeslotService.cancelTimeslot("ts1")).rejects.toThrow(
        "Cannot cancel — 3 active booking(s) exist on this timeslot."
      );

      expect(Timeslot.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("cancels the timeslot when no active bookings exist", async () => {
      vi.mocked(Booking.countDocuments).mockResolvedValue(0 as never);
      const cancelled = { _id: "ts1", status: "cancelled" };
      vi.mocked(Timeslot.findByIdAndUpdate).mockResolvedValue(cancelled as never);

      const result = await timeslotService.cancelTimeslot("ts1");

      expect(Booking.countDocuments).toHaveBeenCalledWith({
        timeslotId: "ts1",
        status: { $nin: ["cancelled", "completed"] },
      });
      expect(Timeslot.findByIdAndUpdate).toHaveBeenCalledWith(
        "ts1",
        { status: "cancelled" },
        { new: true }
      );
      expect(result).toEqual(cancelled);
    });

    it("throws when timeslot not found", async () => {
      vi.mocked(Booking.countDocuments).mockResolvedValue(0 as never);
      vi.mocked(Timeslot.findByIdAndUpdate).mockResolvedValue(null as never);

      await expect(timeslotService.cancelTimeslot("nonexistent")).rejects.toThrow(
        "Timeslot not found"
      );
    });
  });

  // ─── getTimeslotsByRoutePaginated ─────────────────────────────────────────

  describe("getTimeslotsByRoutePaginated", () => {
    it("returns paginated data with correct structure", async () => {
      const mockData = [{ _id: "ts1" }, { _id: "ts2" }];
      const chainMock = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockData),
      };
      vi.mocked(Timeslot.find).mockReturnValue(chainMock as never);
      vi.mocked(Timeslot.countDocuments).mockResolvedValue(32 as never);

      const result = await timeslotService.getTimeslotsByRoutePaginated("route1", 2, 15);

      expect(chainMock.skip).toHaveBeenCalledWith(15); // (page-1) * limit = 1 * 15
      expect(chainMock.limit).toHaveBeenCalledWith(15);
      expect(result).toEqual({ data: mockData, total: 32, page: 2, totalPages: 3 });
    });

    it("calculates totalPages correctly for exact multiples", async () => {
      const chainMock = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(Timeslot.find).mockReturnValue(chainMock as never);
      vi.mocked(Timeslot.countDocuments).mockResolvedValue(30 as never);

      const result = await timeslotService.getTimeslotsByRoutePaginated("route1", 1, 15);

      expect(result.totalPages).toBe(2);
    });

    it("excludes cancelled timeslots from the query", async () => {
      const chainMock = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(Timeslot.find).mockReturnValue(chainMock as never);
      vi.mocked(Timeslot.countDocuments).mockResolvedValue(0 as never);

      await timeslotService.getTimeslotsByRoutePaginated("route1", 1, 15);

      expect(Timeslot.find).toHaveBeenCalledWith({
        routeId: "route1",
        status: { $ne: "cancelled" },
      });
    });
  });

  // ─── bulkCreateTimeslots ─────────────────────────────────────────────────

  describe("bulkCreateTimeslots", () => {
    // Jan 5 2026 = Monday (dow 1), Jan 7 2026 = Wednesday (dow 3)
    const baseInput = {
      routeId: "route1",
      dateFrom: "2026-01-05",
      dateTo: "2026-01-09",
      daysOfWeek: [1, 3], // Mon + Wed → 2026-01-05, 2026-01-07
      times: ["07:00"],
      totalSeats: 12,
    };

    it("creates timeslots only for matching days of week", async () => {
      vi.mocked(Timeslot.findOne).mockResolvedValue(null as never);
      vi.mocked(Timeslot.create).mockResolvedValue({ _id: "new-ts" } as never);

      const result = await timeslotService.bulkCreateTimeslots(baseInput);

      // 2 matching dates × 1 time = 2 created
      expect(result.created).toBe(2);
      expect(result.skipped).toBe(0);
      expect(Timeslot.create).toHaveBeenCalledTimes(2);
      expect(seatService.createSeatsForTimeslot).toHaveBeenCalledTimes(2);
    });

    it("skips duplicate timeslots and counts them separately", async () => {
      // First date/time exists, second does not
      vi.mocked(Timeslot.findOne)
        .mockResolvedValueOnce({ _id: "existing" } as never) // 2026-01-05 07:00 → skip
        .mockResolvedValueOnce(null as never);               // 2026-01-07 07:00 → create
      vi.mocked(Timeslot.create).mockResolvedValue({ _id: "new-ts" } as never);

      const result = await timeslotService.bulkCreateTimeslots(baseInput);

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
      expect(Timeslot.create).toHaveBeenCalledTimes(1);
    });

    it("returns zero created when all slots already exist", async () => {
      vi.mocked(Timeslot.findOne).mockResolvedValue({ _id: "existing" } as never);

      const result = await timeslotService.bulkCreateTimeslots(baseInput);

      expect(result.created).toBe(0);
      expect(result.skipped).toBe(2);
      expect(Timeslot.create).not.toHaveBeenCalled();
    });

    it("creates multiple timeslots per day when multiple times given", async () => {
      vi.mocked(Timeslot.findOne).mockResolvedValue(null as never);
      vi.mocked(Timeslot.create).mockResolvedValue({ _id: "new-ts" } as never);

      const result = await timeslotService.bulkCreateTimeslots({
        ...baseInput,
        times: ["07:00", "09:00", "12:00"],
      });

      // 2 dates × 3 times = 6
      expect(result.created).toBe(6);
      expect(Timeslot.create).toHaveBeenCalledTimes(6);
    });

    it("creates nothing when no dates fall on selected days of week", async () => {
      const result = await timeslotService.bulkCreateTimeslots({
        ...baseInput,
        daysOfWeek: [0], // Sunday only — none in Mon-Fri range
      });

      expect(result.created).toBe(0);
      expect(result.skipped).toBe(0);
      expect(Timeslot.findOne).not.toHaveBeenCalled();
    });

    it("passes correct fields to Timeslot.create", async () => {
      vi.mocked(Timeslot.findOne).mockResolvedValue(null as never);
      vi.mocked(Timeslot.create).mockResolvedValue({ _id: "new-ts" } as never);

      await timeslotService.bulkCreateTimeslots({
        ...baseInput,
        daysOfWeek: [1], // Mon only → 2026-01-05
        times: ["08:30"],
        totalSeats: 20,
      });

      expect(Timeslot.create).toHaveBeenCalledWith({
        routeId: "route1",
        date: "2026-01-05",
        time: "08:30",
        totalSeats: 20,
        bookedSeats: 0,
        status: "active",
      });
    });
  });
});
