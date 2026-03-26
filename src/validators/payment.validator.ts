import { z } from "zod";

export const createPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking is required"),
  method: z.enum(["cash", "bank_transfer", "promptpay"]),
  transactionId: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(["pending", "pending_review", "completed", "failed", "refunded"]),
  transactionId: z.string().optional(),
  reviewNote: z.string().max(500).optional(),
});

export const submitPaymentProofSchema = z.object({
  proofReference: z.string().min(2).max(120),
  paidAt: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type SubmitPaymentProofInput = z.infer<typeof submitPaymentProofSchema>;
