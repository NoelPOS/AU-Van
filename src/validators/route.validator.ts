import { z } from "zod";

export const createRouteSchema = z.object({
  from: z.string().min(2, "Origin is required").max(100),
  to: z.string().min(2, "Destination is required").max(100),
  distance: z.number().positive().optional(),
  duration: z.number().int().positive().optional(),
  price: z.number().min(0, "Price must be non-negative"),
});

export const updateRouteSchema = z.object({
  from: z.string().min(2).max(100).optional(),
  to: z.string().min(2).max(100).optional(),
  distance: z.number().positive().optional(),
  duration: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
