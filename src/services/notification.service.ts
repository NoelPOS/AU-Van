import { connectDB } from "@/libs/mongodb";
import Notification from "@/models/Notification";
// NOTE: connectDB() kept here because notification service is called via EventBus
// (not always from an API route that calls auth guards)
import User from "@/models/User";
import { NotificationFactory } from "@/factories/notification.factory";
import type { NotificationPayload, NotificationResult } from "@/strategies/notification/notification.strategy";
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

  private buildTripSummary(input: {
    routeFrom?: string;
    routeTo?: string;
    date?: string;
    time?: string;
  }) {
    const routeText =
      input.routeFrom && input.routeTo ? `${input.routeFrom} -> ${input.routeTo}` : "your route";
    const dateText = input.date || "the scheduled date";
    const timeText = input.time || "the scheduled time";
    return { routeText, dateText, timeText };
  }

  private formatPaymentMethod(method: string) {
    return method.replace(/_/g, " ");
  }

  private registerEventListeners() {
    eventBus.on(Events.BOOKING_CREATED, async (booking: unknown) => {
      const b = booking as {
        userId: string;
        _id: string;
        bookingCode?: string;
        passengerName: string;
        totalPrice: number;
        routeFrom?: string;
        routeTo?: string;
        date?: string;
        time?: string;
      };
      const trip = this.buildTripSummary(b);
      const bookingRef = b.bookingCode || String(b._id).slice(-6);

      await this.notifyUser(b.userId, {
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: `Your booking ${bookingRef} on ${trip.dateText} at ${trip.timeText} for ${trip.routeText} is confirmed.`,
        data: {
          bookingId: String(b._id),
          bookingCode: b.bookingCode,
          totalPrice: b.totalPrice,
          routeFrom: b.routeFrom,
          routeTo: b.routeTo,
          date: b.date,
          time: b.time,
          action: "confirmed",
        },
      });
      await this.notifyAdmins({
        type: "admin_new_booking",
        title: "New Booking",
        message: `${b.passengerName} created booking ${bookingRef} on ${trip.dateText} at ${trip.timeText} for ${trip.routeText}.`,
        data: {
          bookingId: String(b._id),
          bookingCode: b.bookingCode,
          routeFrom: b.routeFrom,
          routeTo: b.routeTo,
          date: b.date,
          time: b.time,
        },
      });
    });

    eventBus.on(Events.BOOKING_CANCELLED, async (booking: unknown) => {
      const b = booking as {
        userId: string;
        _id: string;
        bookingCode?: string;
        passengerName: string;
        routeFrom?: string;
        routeTo?: string;
        date?: string;
        time?: string;
      };
      const trip = this.buildTripSummary(b);
      const bookingRef = b.bookingCode || String(b._id).slice(-6);

      await this.notifyUser(b.userId, {
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `Your booking ${bookingRef} on ${trip.dateText} at ${trip.timeText} for ${trip.routeText} was cancelled.`,
        data: {
          bookingId: String(b._id),
          bookingCode: b.bookingCode,
          routeFrom: b.routeFrom,
          routeTo: b.routeTo,
          date: b.date,
          time: b.time,
          action: "cancelled",
        },
      });
      await this.notifyAdmins({
        type: "admin_cancellation",
        title: "Booking Cancelled",
        message: `${b.passengerName} cancelled booking ${bookingRef} on ${trip.dateText} at ${trip.timeText} for ${trip.routeText}.`,
        data: {
          bookingId: String(b._id),
          bookingCode: b.bookingCode,
          routeFrom: b.routeFrom,
          routeTo: b.routeTo,
          date: b.date,
          time: b.time,
        },
      });
    });

    eventBus.on(Events.PAYMENT_COMPLETED, async (payment: unknown) => {
      const p = payment as {
        userId: string;
        bookingId: string;
        bookingCode?: string;
        amount: number;
        method: string;
        routeFrom?: string;
        routeTo?: string;
        date?: string;
        time?: string;
      };
      const trip = this.buildTripSummary(p);
      await this.notifyUser(p.userId, {
        type: "payment_received",
        title: "Payment Received",
        message: `Payment received for your ${trip.routeText} trip on ${trip.dateText} at ${trip.timeText}. Amount: ${p.amount} THB via ${this.formatPaymentMethod(p.method)}.`,
        data: {
          bookingId: p.bookingId,
          bookingCode: p.bookingCode,
          amount: p.amount,
          method: p.method,
          routeFrom: p.routeFrom,
          routeTo: p.routeTo,
          date: p.date,
          time: p.time,
          action: "payment_received",
        },
      });
    });

    eventBus.on(Events.PAYMENT_FAILED, async (payment: unknown) => {
      const p = payment as {
        userId: string;
        bookingId: string;
        bookingCode?: string;
        amount: number;
        method: string;
        routeFrom?: string;
        routeTo?: string;
        date?: string;
        time?: string;
      };
      const trip = this.buildTripSummary(p);
      await this.notifyUser(p.userId, {
        type: "payment_failed",
        title: "Payment Needs Attention",
        message: `Payment verification failed for your ${trip.routeText} trip on ${trip.dateText} at ${trip.timeText}. Please upload proof again.`,
        data: {
          bookingId: p.bookingId,
          bookingCode: p.bookingCode,
          amount: p.amount,
          method: p.method,
          routeFrom: p.routeFrom,
          routeTo: p.routeTo,
          date: p.date,
          time: p.time,
          action: "payment_failed",
        },
      });
    });
  }

  private async persistNotification(
    payload: NotificationPayload,
    result: NotificationResult
  ) {
    if (result.deliveryStatus === "skipped") return;

    await Notification.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data,
      read: false,
      channel: result.channel,
      deliveryStatus: result.deliveryStatus,
      externalMessageId: result.externalMessageId,
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
    const results = await Promise.allSettled(
      strategies.map((strategy) => strategy.send(payload))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        await this.persistNotification(payload, result.value);
      }
    }
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
      const results = await Promise.allSettled(
        strategies.map((strategy) => strategy.send(payload))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          await this.persistNotification(payload, result.value);
        }
      }
    }
  }

  async getUserNotifications(userId: string, limit = 20, skip = 0) {
    return Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, read: false });
  }

  async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    ).lean();
  }

  async markAllAsRead(userId: string) {
    return Notification.updateMany({ userId, read: false }, { read: true });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return Notification.findOneAndDelete({ _id: notificationId, userId });
  }
}

export const notificationService = NotificationService.getInstance();
