import { z } from "zod";

export const createTimeslotSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm"),
  totalSeats: z.number().int().min(1, "At least 1 seat required").max(50),
});

export const updateTimeslotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  totalSeats: z.number().int().min(1).max(50).optional(),
  status: z.enum(["active", "cancelled", "full"]).optional(),
});

export const bulkCreateTimeslotSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, "Select at least one day"),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm")).min(1, "Add at least one time"),
  totalSeats: z.number().int().min(1).max(50),
});

export type CreateTimeslotInput = z.infer<typeof createTimeslotSchema>;
export type UpdateTimeslotInput = z.infer<typeof updateTimeslotSchema>;
export type BulkCreateTimeslotInput = z.infer<typeof bulkCreateTimeslotSchema>;
