import type { BadgeVariant } from "@/components/ui/badge";

export const BOOKING_STATUS_VARIANT: Record<string, BadgeVariant> = {
  confirmed:            "success",
  pending_payment:      "warning",
  payment_under_review: "info",
  reschedule_requested: "purple",
  completed:            "default",
  cancelled:            "destructive",
};

export const PAYMENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending:        "warning",
  pending_review: "info",
  completed:      "success",
  failed:         "destructive",
  refunded:       "secondary",
};

export const TIMESLOT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  active:    "success",
  cancelled: "secondary",
  full:      "warning",
};

export function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
