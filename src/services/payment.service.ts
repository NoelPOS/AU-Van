import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import { eventBus, Events } from "@/lib/events";
import { auditLogService } from "@/services/audit-log.service";
import { reminderService } from "@/services/reminder.service";
import mongoose from "mongoose";
import Route from "@/models/Route";
import Timeslot from "@/models/Timeslot";

interface ReviewPaymentInput {
  status: "pending" | "pending_review" | "completed" | "failed" | "refunded";
  transactionId?: string;
  reviewNote?: string;
}

interface ReviewPaymentContext {
  ip?: string;
  userAgent?: string;
}

class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async getUserPayments(userId: string) {
    return Payment.find({ userId })
      .populate("bookingId", "passengerName status totalPrice")
      .sort({ createdAt: -1 })
      .lean();
  }

  async getAllPayments(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {

    const query: Record<string, unknown> = {};
    if (filters?.status) query.status = filters.status;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate({
          path: "bookingId",
          populate: [
            { path: "routeId", select: "from to" },
            { path: "userId", select: "name email" },
          ],
        })
        .populate("userId", "name email")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reviewPayment(
    paymentId: string,
    reviewerId: string,
    input: ReviewPaymentInput,
    context?: ReviewPaymentContext
  ) {

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error("Payment not found");

    const previousStatus = payment.status;

    payment.status = input.status;
    if (input.transactionId) payment.transactionId = input.transactionId;
    if (input.reviewNote !== undefined) payment.reviewNote = input.reviewNote;
    payment.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
    payment.reviewedAt = new Date();
    if (input.status === "completed") payment.paidAt = new Date();
    if (input.status === "refunded") payment.refundedAt = new Date();
    await payment.save();

    if (input.status === "completed") {
      await Booking.findByIdAndUpdate(payment.bookingId, { status: "confirmed" });
      await reminderService.scheduleForBooking(String(payment.bookingId));
      const booking = await Booking.findById(payment.bookingId).select("bookingCode routeId timeslotId").lean();
      const [route, timeslot] = await Promise.all([
        booking?.routeId ? Route.findById(booking.routeId).select("from to").lean() : null,
        booking?.timeslotId ? Timeslot.findById(booking.timeslotId).select("date time").lean() : null,
      ]);
      await eventBus.emit(Events.PAYMENT_COMPLETED, {
        userId: String(payment.userId),
        bookingId: String(payment.bookingId),
        bookingCode: booking?.bookingCode,
        amount: payment.amount,
        method: payment.method,
        routeFrom: route?.from,
        routeTo: route?.to,
        date: timeslot?.date,
        time: timeslot?.time,
      });
    } else if (input.status === "failed") {
      await Booking.findByIdAndUpdate(payment.bookingId, { status: "pending_payment" });
      await reminderService.cancelForBooking(String(payment.bookingId));
      const booking = await Booking.findById(payment.bookingId).select("bookingCode routeId timeslotId").lean();
      const [route, timeslot] = await Promise.all([
        booking?.routeId ? Route.findById(booking.routeId).select("from to").lean() : null,
        booking?.timeslotId ? Timeslot.findById(booking.timeslotId).select("date time").lean() : null,
      ]);
      await eventBus.emit(Events.PAYMENT_FAILED, {
        userId: String(payment.userId),
        bookingId: String(payment.bookingId),
        bookingCode: booking?.bookingCode,
        amount: payment.amount,
        method: payment.method,
        routeFrom: route?.from,
        routeTo: route?.to,
        date: timeslot?.date,
        time: timeslot?.time,
      });
    } else if (input.status === "pending_review") {
      await Booking.findByIdAndUpdate(payment.bookingId, { status: "payment_under_review" });
    }

    await auditLogService.create({
      actorId: reviewerId,
      action: "payment_reviewed",
      targetType: "payment",
      targetId: String(payment._id),
      metadata: {
        bookingId: String(payment.bookingId),
        fromStatus: previousStatus,
        toStatus: input.status,
        reviewNote: input.reviewNote || null,
      },
      ip: context?.ip,
      userAgent: context?.userAgent,
    });

    return payment;
  }
}

export const paymentService = PaymentService.getInstance();
