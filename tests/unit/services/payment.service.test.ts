import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing service
vi.mock("@/models/Payment", () => {
  const mockPayment = {
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
  };
  return { default: mockPayment };
});

vi.mock("@/models/Booking", () => {
  const mockBooking = {
    findByIdAndUpdate: vi.fn(),
  };
  return { default: mockBooking };
});

vi.mock("@/lib/events", () => ({
  eventBus: { emit: vi.fn().mockResolvedValue(undefined) },
  Events: {
    PAYMENT_COMPLETED: "payment:completed",
    PAYMENT_FAILED: "payment:failed",
  },
}));

vi.mock("@/services/audit-log.service", () => ({
  auditLogService: { create: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/services/reminder.service", () => ({
  reminderService: {
    scheduleForBooking: vi.fn().mockResolvedValue(undefined),
    cancelForBooking: vi.fn().mockResolvedValue(undefined),
  },
}));

import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import { eventBus, Events } from "@/lib/events";
import { auditLogService } from "@/services/audit-log.service";
import { reminderService } from "@/services/reminder.service";
import { paymentService } from "@/services/payment.service";

describe("PaymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserPayments", () => {
    it("queries payments by userId with population and sorting", async () => {
      const mockPayments = [{ _id: "p1", amount: 100 }];
      const chainMock = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockPayments),
      };
      vi.mocked(Payment.find).mockReturnValue(chainMock as never);

      const result = await paymentService.getUserPayments("user123");

      expect(Payment.find).toHaveBeenCalledWith({ userId: "user123" });
      expect(chainMock.populate).toHaveBeenCalledWith("bookingId", "passengerName status totalPrice");
      expect(chainMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockPayments);
    });
  });

  describe("getAllPayments", () => {
    it("returns paginated payments with default page/limit", async () => {
      const mockPayments = [{ _id: "p1" }];
      const chainMock = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockPayments),
      };
      vi.mocked(Payment.find).mockReturnValue(chainMock as never);
      vi.mocked(Payment.countDocuments).mockResolvedValue(1 as never);

      const result = await paymentService.getAllPayments();

      expect(Payment.find).toHaveBeenCalledWith({});
      expect(chainMock.skip).toHaveBeenCalledWith(0);
      expect(chainMock.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        payments: mockPayments,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it("applies status filter when provided", async () => {
      const chainMock = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(Payment.find).mockReturnValue(chainMock as never);
      vi.mocked(Payment.countDocuments).mockResolvedValue(0 as never);

      await paymentService.getAllPayments({ status: "pending_review", page: 2, limit: 10 });

      expect(Payment.find).toHaveBeenCalledWith({ status: "pending_review" });
      expect(chainMock.skip).toHaveBeenCalledWith(10); // (2-1)*10
      expect(chainMock.limit).toHaveBeenCalledWith(10);
    });
  });

  describe("reviewPayment", () => {
    const PAYMENT_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
    const BOOKING_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
    const USER_ID = "cccccccccccccccccccccccc";
    const ADMIN_ID = "dddddddddddddddddddddddd";

    const createMockPayment = (overrides = {}) => ({
      _id: PAYMENT_ID,
      bookingId: BOOKING_ID,
      userId: USER_ID,
      amount: 500,
      method: "promptpay",
      status: "pending_review",
      save: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    });

    it("approves payment and confirms booking", async () => {
      const mockPayment = createMockPayment();
      vi.mocked(Payment.findById).mockResolvedValue(mockPayment as never);
      vi.mocked(Booking.findByIdAndUpdate).mockResolvedValue(null as never);

      await paymentService.reviewPayment(PAYMENT_ID, ADMIN_ID, {
        status: "completed",
        reviewNote: "Slip verified",
      });

      expect(mockPayment.status).toBe("completed");
      expect(mockPayment.reviewNote).toBe("Slip verified");
      expect(mockPayment.paidAt).toBeInstanceOf(Date);
      expect(mockPayment.save).toHaveBeenCalled();

      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(BOOKING_ID, { status: "confirmed" });
      expect(reminderService.scheduleForBooking).toHaveBeenCalledWith(BOOKING_ID);
      expect(eventBus.emit).toHaveBeenCalledWith(Events.PAYMENT_COMPLETED, {
        userId: USER_ID,
        amount: 500,
        method: "promptpay",
      });
      expect(auditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: ADMIN_ID,
          action: "payment_reviewed",
          targetType: "payment",
        })
      );
    });

    it("rejects payment and reverts booking to pending_payment", async () => {
      const mockPayment = createMockPayment();
      vi.mocked(Payment.findById).mockResolvedValue(mockPayment as never);
      vi.mocked(Booking.findByIdAndUpdate).mockResolvedValue(null as never);

      await paymentService.reviewPayment(PAYMENT_ID, ADMIN_ID, {
        status: "failed",
        reviewNote: "Invalid slip",
      });

      expect(mockPayment.status).toBe("failed");
      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(BOOKING_ID, { status: "pending_payment" });
      expect(reminderService.cancelForBooking).toHaveBeenCalledWith(BOOKING_ID);
      expect(eventBus.emit).toHaveBeenCalledWith(Events.PAYMENT_FAILED, {
        userId: USER_ID,
        amount: 500,
      });
    });

    it("throws when payment not found", async () => {
      vi.mocked(Payment.findById).mockResolvedValue(null as never);

      await expect(
        paymentService.reviewPayment("nonexistent", ADMIN_ID, { status: "completed" })
      ).rejects.toThrow("Payment not found");
    });

    it("sets refundedAt when status is refunded", async () => {
      const mockPayment = createMockPayment();
      vi.mocked(Payment.findById).mockResolvedValue(mockPayment as never);

      await paymentService.reviewPayment(PAYMENT_ID, ADMIN_ID, { status: "refunded" });

      expect(mockPayment.refundedAt).toBeInstanceOf(Date);
    });
  });
});
