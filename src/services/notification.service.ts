import { connectDB } from "@/libs/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { NotificationFactory } from "@/factories/notification.factory";
import type { NotificationPayload } from "@/strategies/notification/notification.strategy";
import { eventBus, Events } from "@/lib/events";

class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.registerEventListeners();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private registerEventListeners() {
    eventBus.on(Events.BOOKING_CREATED, async (booking: unknown) => {
      const b = booking as {
        userId: string;
        _id: string;
        passengerName: string;
        totalPrice: number;
      };
      await this.notifyUser(b.userId, {
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: `Your booking #${String(b._id).slice(-6)} has been confirmed.`,
        data: { bookingId: String(b._id), totalPrice: b.totalPrice },
      });
      await this.notifyAdmins({
        type: "admin_new_booking",
        title: "New Booking",
        message: `${b.passengerName} made a new booking #${String(b._id).slice(-6)}.`,
        data: { bookingId: String(b._id) },
      });
    });

    eventBus.on(Events.BOOKING_CANCELLED, async (booking: unknown) => {
      const b = booking as { userId: string; _id: string; passengerName: string };
      await this.notifyUser(b.userId, {
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `Your booking #${String(b._id).slice(-6)} has been cancelled.`,
        data: { bookingId: String(b._id) },
      });
      await this.notifyAdmins({
        type: "admin_cancellation",
        title: "Booking Cancelled",
        message: `${b.passengerName} cancelled booking #${String(b._id).slice(-6)}.`,
        data: { bookingId: String(b._id) },
      });
    });

    eventBus.on(Events.PAYMENT_COMPLETED, async (payment: unknown) => {
      const p = payment as { userId: string; amount: number; method: string };
      await this.notifyUser(p.userId, {
        type: "payment_received",
        title: "Payment Received",
        message: `Your payment of ${p.amount} THB via ${p.method} has been received.`,
        data: { amount: p.amount, method: p.method },
      });
    });
  }

  async notifyUser(
    userId: string,
    notification: { type: string; title: string; message: string; data?: Record<string, unknown> }
  ) {
    await connectDB();
    const user = await User.findById(userId).lean();
    if (!user) return;

    const payload: NotificationPayload = {
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      email: user.email,
      lineUserId: user.lineUserId,
    };

    const strategies = NotificationFactory.createAll();
    await Promise.allSettled(strategies.map((strategy) => strategy.send(payload)));
  }

  async notifyAdmins(notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    await connectDB();
    const admins = await User.find({ isAdmin: true }).lean();

    for (const admin of admins) {
      const payload: NotificationPayload = {
        userId: String(admin._id),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        email: admin.email,
        lineUserId: admin.lineUserId,
      };

      const strategies = NotificationFactory.createAll();
      await Promise.allSettled(strategies.map((strategy) => strategy.send(payload)));
    }
  }

  async getUserNotifications(userId: string, limit = 20, skip = 0) {
    await connectDB();
    return Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async getUnreadCount(userId: string): Promise<number> {
    await connectDB();
    return Notification.countDocuments({ userId, read: false });
  }

  async markAsRead(notificationId: string, userId: string) {
    await connectDB();
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    ).lean();
  }

  async markAllAsRead(userId: string) {
    await connectDB();
    return Notification.updateMany({ userId, read: false }, { read: true });
  }

  async deleteNotification(notificationId: string, userId: string) {
    await connectDB();
    return Notification.findOneAndDelete({ _id: notificationId, userId });
  }
}

export const notificationService = NotificationService.getInstance();
