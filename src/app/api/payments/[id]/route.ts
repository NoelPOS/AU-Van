import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/libs/mongodb";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import { updatePaymentSchema } from "@/validators/payment.validator";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";
import { eventBus, Events } from "@/lib/events";
import { auditLogService } from "@/services/audit-log.service";
import { reminderService } from "@/services/reminder.service";

// Admin: update payment status (confirm bank transfer, etc.)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const parsed = updatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    await connectDB();
    const payment = await Payment.findById(params.id);
    if (!payment) return notFoundResponse("Payment");
    const previousStatus = payment.status;

    payment.status = parsed.data.status;
    if (parsed.data.transactionId) payment.transactionId = parsed.data.transactionId;
    if (parsed.data.reviewNote !== undefined) payment.reviewNote = parsed.data.reviewNote;
    payment.reviewedBy = session!.user._id as any;
    payment.reviewedAt = new Date();
    if (parsed.data.status === "completed") payment.paidAt = new Date();
    if (parsed.data.status === "refunded") payment.refundedAt = new Date();
    await payment.save();

    // Update booking status based on payment
    if (parsed.data.status === "completed") {
      await Booking.findByIdAndUpdate(payment.bookingId, { status: "confirmed" });
      await reminderService.scheduleForBooking(String(payment.bookingId));
      await eventBus.emit(Events.PAYMENT_COMPLETED, {
        userId: String(payment.userId),
        amount: payment.amount,
        method: payment.method,
      });
    } else if (parsed.data.status === "failed") {
      await Booking.findByIdAndUpdate(payment.bookingId, { status: "pending_payment" });
      await reminderService.cancelForBooking(String(payment.bookingId));
      await eventBus.emit(Events.PAYMENT_FAILED, {
        userId: String(payment.userId),
        amount: payment.amount,
      });
    } else if (parsed.data.status === "pending_review") {
      await Booking.findByIdAndUpdate(payment.bookingId, { status: "payment_under_review" });
    }

    await auditLogService.create({
      actorId: session!.user._id,
      action: "payment_reviewed",
      targetType: "payment",
      targetId: String(payment._id),
      metadata: {
        bookingId: String(payment.bookingId),
        fromStatus: previousStatus,
        toStatus: parsed.data.status,
        reviewNote: parsed.data.reviewNote || null,
      },
      ip: req.headers.get("x-forwarded-for") || req.ip || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return successResponse(payment, "Payment updated");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
