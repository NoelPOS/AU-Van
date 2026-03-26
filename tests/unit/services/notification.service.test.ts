import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/libs/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Notification", () => {
  const mockNotification = {
    create: vi.fn().mockResolvedValue({ _id: "notif1" }),
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateMany: vi.fn(),
    countDocuments: vi.fn(),
  };
  return { default: mockNotification };
});

vi.mock("@/models/User", () => {
  const findByIdChain = {
    lean: vi.fn(),
  };
  const mockUser = {
    findById: vi.fn().mockReturnValue(findByIdChain),
    find: vi.fn(),
    _findByIdChain: findByIdChain,
  };
  return { default: mockUser };
});

vi.mock("@/factories/notification.factory", () => ({
  NotificationFactory: {
    createAll: vi.fn().mockReturnValue([]),
  },
}));

vi.mock("@/lib/events", () => {
  const listeners: Record<string, ((...args: unknown[]) => Promise<void>)[]> = {};
  return {
    eventBus: {
      on: vi.fn((event: string, handler: (...args: unknown[]) => Promise<void>) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      }),
      emit: vi.fn(async (event: string, data: unknown) => {
        for (const handler of (listeners[event] || [])) {
          await handler(data);
        }
      }),
    },
    Events: {
      BOOKING_CREATED: "booking:created",
      BOOKING_CANCELLED: "booking:cancelled",
      BOOKING_UPDATED: "booking:updated",
      PAYMENT_COMPLETED: "payment:completed",
      PAYMENT_FAILED: "payment:failed",
    },
  };
});

import Notification from "@/models/Notification";
import User from "@/models/User";
import { NotificationFactory } from "@/factories/notification.factory";
import { notificationService } from "@/services/notification.service";

describe("NotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("notifyUser", () => {
    it("calls strategies and persists notifications for each successful channel", async () => {
      const mockUser = { _id: "user123", email: "test@example.com", lineUserId: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (User as any)._findByIdChain.lean.mockResolvedValue(mockUser);

      const mockStrategy = {
        send: vi.fn().mockResolvedValue({
          success: true,
          channel: "inapp",
          deliveryStatus: "sent",
        }),
      };
      vi.mocked(NotificationFactory.createAll).mockReturnValue([mockStrategy]);

      await notificationService.notifyUser("user123", {
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: "Your booking was confirmed.",
      });

      expect(NotificationFactory.createAll).toHaveBeenCalled();
      expect(mockStrategy.send).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user123",
          type: "booking_confirmed",
          title: "Booking Confirmed",
        })
      );
      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user123",
          type: "booking_confirmed",
          channel: "inapp",
          deliveryStatus: "sent",
        })
      );
    });

    it("does not persist notifications with skipped delivery status", async () => {
      const mockUser = { _id: "user123", email: "test@example.com" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (User as any)._findByIdChain.lean.mockResolvedValue(mockUser);

      const mockStrategy = {
        send: vi.fn().mockResolvedValue({
          success: true,
          channel: "email",
          deliveryStatus: "skipped",
        }),
      };
      vi.mocked(NotificationFactory.createAll).mockReturnValue([mockStrategy]);

      await notificationService.notifyUser("user123", {
        type: "test",
        title: "Test",
        message: "Test message",
      });

      expect(Notification.create).not.toHaveBeenCalled();
    });

    it("skips when user not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (User as any)._findByIdChain.lean.mockResolvedValue(null);

      await notificationService.notifyUser("nonexistent", {
        type: "test",
        title: "Test",
        message: "Test message",
      });

      expect(NotificationFactory.createAll).not.toHaveBeenCalled();
      expect(Notification.create).not.toHaveBeenCalled();
    });
  });

  describe("getUserNotifications", () => {
    it("queries notifications by userId with sorting and pagination", async () => {
      const mockNotifications = [{ _id: "n1", title: "Test" }];
      const chainMock = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockNotifications),
      };
      vi.mocked(Notification.find).mockReturnValue(chainMock as never);

      const result = await notificationService.getUserNotifications("user123", 20);

      expect(Notification.find).toHaveBeenCalledWith({ userId: "user123" });
      expect(chainMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(chainMock.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe("markAsRead", () => {
    it("updates notification read status", async () => {
      const chainMock = {
        lean: vi.fn().mockResolvedValue({ _id: "n1", read: true }),
      };
      vi.mocked(Notification.findOneAndUpdate).mockReturnValue(chainMock as never);

      const result = await notificationService.markAsRead("n1", "user123");

      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "n1", userId: "user123" },
        { read: true },
        { new: true }
      );
      expect(result).toEqual({ _id: "n1", read: true });
    });
  });

  describe("getUnreadCount", () => {
    it("counts unread notifications for user", async () => {
      vi.mocked(Notification.countDocuments).mockResolvedValue(5 as never);

      const result = await notificationService.getUnreadCount("user123");

      expect(Notification.countDocuments).toHaveBeenCalledWith({
        userId: "user123",
        read: false,
      });
      expect(result).toBe(5);
    });
  });
});
