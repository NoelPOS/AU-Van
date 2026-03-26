import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies
vi.mock("@/models/Booking", () => {
  const mockBooking = {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  };
  return { default: mockBooking };
});

vi.mock("@/models/Route", () => ({
  default: { findById: vi.fn() },
}));

vi.mock("@/models/Timeslot", () => ({
  default: { findById: vi.fn() },
}));

vi.mock("@/models/Payment", () => ({
  default: { create: vi.fn() },
}));

vi.mock("@/services/seat.service", () => ({
  seatService: {
    lockSeats: vi.fn().mockResolvedValue(undefined),
    confirmSeats: vi.fn().mockResolvedValue(undefined),
    freeSeats: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/services/reminder.service", () => ({
  reminderService: {
    scheduleForBooking: vi.fn().mockResolvedValue(undefined),
    cancelForBooking: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/services/idempotency.service", () => ({
  idempotencyService: {
    check: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(undefined),
    complete: vi.fn().mockResolvedValue(undefined),
    fail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/events", () => ({
  eventBus: { emit: vi.fn().mockResolvedValue(undefined) },
  Events: {
    BOOKING_CREATED: "booking:created",
    BOOKING_CANCELLED: "booking:cancelled",
    BOOKING_UPDATED: "booking:updated",
  },
}));

import Booking from "@/models/Booking";
import { seatService } from "@/services/seat.service";
import { eventBus, Events } from "@/lib/events";
import { bookingService } from "@/services/booking.service";

describe("BookingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserBookings", () => {
    it("queries bookings for a user with full population", async () => {
      const mockBookings = [{ _id: "b1", status: "confirmed" }];
      const chainMock = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockBookings),
      };
      vi.mocked(Booking.find).mockReturnValue(chainMock as never);

      const result = await bookingService.getUserBookings("user123");

      expect(Booking.find).toHaveBeenCalledWith({ userId: "user123" });
      expect(chainMock.populate).toHaveBeenCalledWith("routeId", "from to slug price");
      expect(chainMock.populate).toHaveBeenCalledWith("timeslotId", "date time");
      expect(chainMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockBookings);
    });
  });

  describe("getBookingById", () => {
    it("finds booking by ID and populates related fields", async () => {
      const mockBooking = { _id: "b1", status: "pending" };
      const chainMock = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockBooking),
      };
      vi.mocked(Booking.findOne).mockReturnValue(chainMock as never);

      const result = await bookingService.getBookingById("b1");

      expect(Booking.findOne).toHaveBeenCalledWith({ _id: "b1" });
      expect(result).toEqual(mockBooking);
    });

    it("includes userId filter when userId is provided", async () => {
      const chainMock = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(Booking.findOne).mockReturnValue(chainMock as never);

      await bookingService.getBookingById("b1", "user123");

      expect(Booking.findOne).toHaveBeenCalledWith({ _id: "b1", userId: "user123" });
    });
  });

  describe("cancelBooking", () => {
    it("cancels a booking and releases seats", async () => {
      const seatIds = ["seat1", "seat2"];
      const mockBooking = {
        _id: "b1",
        userId: "user123",
        status: "pending",
        passengerName: "John",
        seatIds,
        paymentId: null,
        save: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(Booking.findOne).mockResolvedValue(mockBooking as never);

      await bookingService.cancelBooking("b1", "user123");

      expect(mockBooking.status).toBe("cancelled");
      expect(mockBooking.save).toHaveBeenCalled();
      expect(seatService.freeSeats).toHaveBeenCalledWith(["seat1", "seat2"]);
      expect(eventBus.emit).toHaveBeenCalledWith(
        Events.BOOKING_CANCELLED,
        expect.objectContaining({
          _id: "b1",
          userId: "user123",
          passengerName: "John",
        })
      );
    });

    it("throws when booking not found", async () => {
      const chainMock = { populate: vi.fn().mockResolvedValue(null) };
      vi.mocked(Booking.findOne).mockReturnValue(chainMock as never);

      await expect(bookingService.cancelBooking("nonexistent", "user123")).rejects.toThrow();
    });

    it("throws when booking already cancelled", async () => {
      const chainMock = {
        populate: vi.fn().mockResolvedValue({
          _id: "b1",
          userId: "user123",
          status: "cancelled",
        }),
      };
      vi.mocked(Booking.findOne).mockReturnValue(chainMock as never);

      await expect(bookingService.cancelBooking("b1", "user123")).rejects.toThrow();
    });
  });

  describe("updateBooking", () => {
    it("updates passenger details on a booking", async () => {
      const mockBooking = {
        _id: "b1",
        userId: "user123",
        status: "pending",
        passengerName: "Old Name",
        passengerPhone: "000",
        pickupLocation: "Old Location",
        save: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(Booking.findOne).mockResolvedValue(mockBooking as never);

      await bookingService.updateBooking("b1", "user123", {
        passengerName: "New Name",
        passengerPhone: "111",
        pickupLocation: "New Location",
      });

      expect(mockBooking.passengerName).toBe("New Name");
      expect(mockBooking.passengerPhone).toBe("111");
      expect(mockBooking.pickupLocation).toBe("New Location");
      expect(mockBooking.save).toHaveBeenCalled();
    });
  });
});
