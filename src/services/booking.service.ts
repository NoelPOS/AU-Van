import mongoose from "mongoose";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Route from "@/models/Route";
import Timeslot from "@/models/Timeslot";
import { seatService } from "./seat.service";
import { PaymentFactory } from "@/factories/payment.factory";
import { eventBus, Events } from "@/lib/events";
import { reminderService } from "@/services/reminder.service";
import type { PaymentMethod } from "@/types";
import type { CreateBookingInput } from "@/validators/booking.validator";

type SubmitPaymentProofInput = {
  proofImageUrl: string;
  proofReference: string;
  paidAt?: string;
};

function parseTimeslotDateTime(date: string, time: string): Date {
  const hhmm = /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const parsed = new Date(`${date}T${hhmm}:00`);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  // Fallback when old records keep 12-hour time strings.
  const fallback = new Date(`${date} ${time}`);
  return fallback;
}

function buildBookingCode(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AUV-${y}${m}${d}-${rand}`;
}

class BookingService {
  private static instance: BookingService;

  private constructor() {}

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  async createBooking(userId: string, input: CreateBookingInput) {

    const route = await Route.findById(input.routeId);
    if (!route || route.status !== "active") {
      throw new Error("Route not found or inactive");
    }

    const timeslot = await Timeslot.findById(input.timeslotId);
    if (!timeslot || timeslot.status !== "active") {
      throw new Error("Timeslot not available");
    }

    const totalPrice = route.price * input.seatIds.length;

    await seatService.confirmSeats(input.seatIds, userId);

    const bookingStatus =
      input.paymentMethod === "cash" ? "confirmed" : "pending_payment";

    const booking = await Booking.create({
      userId,
      routeId: input.routeId,
      timeslotId: input.timeslotId,
      seatIds: input.seatIds,
      passengers: input.seatIds.length,
      passengerName: input.passengerName,
      passengerPhone: input.passengerPhone,
      pickupLocation: input.pickupLocation,
      status: bookingStatus,
      sourceChannel: input.sourceChannel || "liff",
      bookingCode: buildBookingCode(),
      totalPrice,
    });

    let generatedTransactionId: string | undefined;
    if (input.paymentMethod === "cash") {
      const paymentStrategy = PaymentFactory.create("cash");
      const paymentResult = await paymentStrategy.processPayment({
        bookingId: String(booking._id),
        userId,
        amount: totalPrice,
        method: input.paymentMethod,
      });
      generatedTransactionId = paymentResult.transactionId;
    }

    const payment = await Payment.create({
      bookingId: booking._id,
      userId,
      amount: totalPrice,
      method: input.paymentMethod,
      status: input.paymentMethod === "cash" ? "pending" : "pending",
      transactionId: generatedTransactionId,
      paidAt: undefined,
    });

    booking.paymentId = new mongoose.Types.ObjectId(String(payment._id));
    await booking.save();

    await eventBus.emit(Events.BOOKING_CREATED, {
      _id: booking._id,
      userId,
      passengerName: input.passengerName,
      totalPrice,
      route: `${route.from} -> ${route.to}`,
      date: timeslot.date,
      time: timeslot.time,
    });

    if (booking.status === "confirmed") {
      await reminderService.scheduleForBooking(String(booking._id));
    }

    return booking.populate(["routeId", "timeslotId", "seatIds", "paymentId"]);
  }

  async submitPaymentProof(
    bookingId: string,
    userId: string,
    input: SubmitPaymentProofInput
  ) {

    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error("Booking cannot accept payment proof");
    }
    if (!booking.paymentId) throw new Error("Payment record not found");

    const payment = await Payment.findById(booking.paymentId);
    if (!payment) throw new Error("Payment record not found");
    if (payment.method === "cash") {
      throw new Error("Cash payment does not require proof upload");
    }
    if (payment.status === "pending_review") {
      throw new Error("Payment proof is already under review");
    }
    if (payment.status === "completed") {
      throw new Error("Payment has already been approved");
    }

    payment.proofImageUrl = input.proofImageUrl;
    payment.proofReference = input.proofReference;
    payment.proofSubmittedAt = input.paidAt ? new Date(input.paidAt) : new Date();
    payment.status = "pending_review";
    if (!payment.transactionId) payment.transactionId = input.proofReference;
    await payment.save();

    booking.status = "payment_under_review";
    await booking.save();

    await eventBus.emit(Events.BOOKING_UPDATED, {
      _id: booking._id,
      userId,
      passengerName: booking.passengerName,
    });

    return payment;
  }

  async rescheduleBooking(
    bookingId: string,
    userId: string,
    input: {
      timeslotId: string;
      seatIds: string[];
    }
  ) {

    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error("Booking cannot be rescheduled");
    }

    const oldTimeslot = await Timeslot.findById(booking.timeslotId);
    if (!oldTimeslot) throw new Error("Original timeslot not found");

    const departure = parseTimeslotDateTime(oldTimeslot.date, oldTimeslot.time);
    if (!Number.isNaN(departure.getTime())) {
      const diffMs = departure.getTime() - Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      if (diffMs < twoHoursMs) {
        throw new Error("Reschedule must be requested at least 2 hours before departure");
      }
    }

    const nextTimeslot = await Timeslot.findById(input.timeslotId);
    if (!nextTimeslot || nextTimeslot.status !== "active") {
      throw new Error("Target timeslot is not available");
    }

    await seatService.lockSeats(input.timeslotId, input.seatIds, userId);
    await seatService.confirmSeats(input.seatIds, userId);

    await seatService.freeSeats(booking.seatIds.map(String));

    booking.rescheduledFromBookingId =
      booking.rescheduledFromBookingId || new mongoose.Types.ObjectId(String(booking._id));
    booking.timeslotId = new mongoose.Types.ObjectId(String(nextTimeslot._id));
    booking.seatIds = input.seatIds.map(id => new mongoose.Types.ObjectId(id));
    booking.passengers = input.seatIds.length;
    booking.status = "reschedule_requested";
    await booking.save();

    await eventBus.emit(Events.BOOKING_UPDATED, {
      _id: booking._id,
      userId,
      passengerName: booking.passengerName,
    });

    return booking.populate(["routeId", "timeslotId", "seatIds", "paymentId"]);
  }

  async getUserBookings(userId: string) {
    return Booking.find({ userId })
      .populate("routeId", "from to slug price")
      .populate("timeslotId", "date time")
      .populate("seatIds", "label seatNumber")
      .populate(
        "paymentId",
        "amount method status transactionId proofImageUrl proofReference proofSubmittedAt reviewedAt reviewNote"
      )
      .sort({ createdAt: -1 })
      .lean();
  }

  async getBookingById(bookingId: string, userId?: string) {
    const query: Record<string, string> = { _id: bookingId };
    if (userId) query.userId = userId;

    return Booking.findOne(query)
      .populate("routeId", "from to slug price")
      .populate("timeslotId", "date time totalSeats bookedSeats")
      .populate("seatIds", "label seatNumber status")
      .populate(
        "paymentId",
        "amount method status transactionId proofImageUrl proofReference proofSubmittedAt reviewedBy reviewedAt reviewNote paidAt"
      )
      .populate("userId", "name email phone")
      .lean();
  }

  async updateBooking(
    bookingId: string,
    userId: string,
    updates: { passengerName?: string; passengerPhone?: string; pickupLocation?: string }
  ) {

    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error("Cannot update a cancelled or completed booking");
    }

    Object.assign(booking, updates);
    await booking.save();

    await eventBus.emit(Events.BOOKING_UPDATED, {
      _id: booking._id,
      userId,
      passengerName: booking.passengerName,
    });

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string, isAdmin = false) {

    const query: Record<string, string> = { _id: bookingId };
    if (!isAdmin) query.userId = userId;

    const booking = await Booking.findOne(query);
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled") throw new Error("Booking already cancelled");

    await seatService.freeSeats(booking.seatIds.map(String));

    if (booking.paymentId) {
      const payment = await Payment.findById(booking.paymentId);
      if (payment && payment.status === "completed") {
        const paymentStrategy = PaymentFactory.create(payment.method as PaymentMethod);
        await paymentStrategy.processRefund(payment.transactionId || "", payment.amount);
        payment.status = "refunded";
        payment.refundedAt = new Date();
        await payment.save();
      }
    }

    booking.status = "cancelled";
    await booking.save();

    await reminderService.cancelForBooking(String(booking._id));

    await eventBus.emit(Events.BOOKING_CANCELLED, {
      _id: booking._id,
      userId: String(booking.userId),
      passengerName: booking.passengerName,
    });

    return booking;
  }

  async getAllBookings(filters?: {
    status?: string;
    date?: string;
    routeId?: string;
    page?: number;
    limit?: number;
  }) {

    const query: Record<string, unknown> = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.routeId) query.routeId = filters.routeId;
    if (filters?.date) {
      query.createdAt = {
        $gte: new Date(`${filters.date}T00:00:00`),
        $lte: new Date(`${filters.date}T23:59:59`),
      };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("routeId", "from to slug price")
        .populate("timeslotId", "date time")
        .populate("seatIds", "label seatNumber")
        .populate("userId", "name email phone")
        .populate(
          "paymentId",
          "amount method status transactionId proofReference proofSubmittedAt reviewedAt reviewNote"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query),
    ]);

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDashboardStats() {

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const [totalBookingsToday, totalRevenue, totalPassengers, activeRoutes, recentBookings] =
      await Promise.all([
        Booking.countDocuments({
          createdAt: { $gte: startOfDay, $lt: endOfDay },
          status: { $ne: "cancelled" },
        }),
        Booking.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $group: { _id: null, total: { $sum: "$totalPrice" } } },
        ]).then((r) => r[0]?.total || 0),
        Booking.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $group: { _id: null, total: { $sum: "$passengers" } } },
        ]).then((r) => r[0]?.total || 0),
        Route.countDocuments({ status: "active" }),
        Booking.find({ status: { $ne: "cancelled" } })
          .populate("routeId", "from to")
          .populate("timeslotId", "date time")
          .populate("userId", "name email")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

    return {
      totalBookingsToday,
      totalRevenue,
      totalPassengers,
      activeRoutes,
      recentBookings,
    };
  }
}

export const bookingService = BookingService.getInstance();
