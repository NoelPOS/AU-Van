import { z } from "zod";

export const createBookingSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
  timeslotId: z.string().min(1, "Timeslot is required"),
  seatIds: z.array(z.string()).min(1, "At least one seat must be selected"),
  passengerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  passengerPhone: z.string().min(9, "Valid phone number required").max(15),
  pickupLocation: z.string().min(2, "Pickup location is required").max(200),
  paymentMethod: z.enum(["cash", "bank_transfer", "promptpay"]),
  sourceChannel: z.enum(["web_admin", "liff", "line_bot"]).optional(),
});

export const updateBookingSchema = z.object({
  passengerName: z.string().min(2).max(100).optional(),
  passengerPhone: z.string().min(9).max(15).optional(),
  pickupLocation: z.string().min(2).max(200).optional(),
  status: z
    .enum([
      "pending",
      "pending_payment",
      "payment_under_review",
      "confirmed",
      "reschedule_requested",
      "cancelled",
      "completed",
    ])
    .optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
