// User
export interface IUser {
  _id: string;
  email?: string;
  password: string;
  lineUserId?: string;
  authProvider?: "local" | "google" | "line";
  displayName?: string;
  pictureUrl?: string;
  lineLinkedAt?: Date;
  name: string;
  phone?: string;
  defaultPickupLocation?: string;
  profileImageUrl?: string;
  profileImageKey?: string;
  image?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Route
export type RouteStatus = "active" | "inactive";

export interface IRoute {
  _id: string;
  from: string;
  to: string;
  slug: string;
  distance?: number;
  duration?: number;
  price: number;
  status: RouteStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Timeslot
export type TimeslotStatus = "active" | "cancelled" | "full";

export interface ITimeslot {
  _id: string;
  routeId: string | IRoute;
  date: string;
  time: string;
  totalSeats: number;
  bookedSeats: number;
  status: TimeslotStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Seat
export type SeatStatus = "available" | "locked" | "booked";

export interface ISeat {
  _id: string;
  timeslotId: string | ITimeslot;
  seatNumber: number;
  label: string;
  status: SeatStatus;
  lockedBy?: string;
  lockedAt?: Date;
  bookedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Booking
export type BookingStatus =
  | "pending"
  | "pending_payment"
  | "payment_under_review"
  | "confirmed"
  | "reschedule_requested"
  | "cancelled"
  | "completed";

export interface IBooking {
  _id: string;
  userId: string | IUser;
  routeId: string | IRoute;
  timeslotId: string | ITimeslot;
  seatIds: string[] | ISeat[];
  passengers: number;
  passengerName: string;
  passengerPhone: string;
  pickupLocation: string;
  status: BookingStatus;
  paymentId?: string | IPayment;
  bookingCode?: string;
  sourceChannel?: "web_admin" | "liff" | "line_bot";
  rescheduledFromBookingId?: string;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

// Payment
export type PaymentMethod = "cash" | "bank_transfer" | "promptpay";
export type PaymentStatus =
  | "pending"
  | "pending_review"
  | "completed"
  | "failed"
  | "refunded";

export interface IPayment {
  _id: string;
  bookingId: string | IBooking;
  userId: string | IUser;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  proofImageUrl?: string;
  proofReference?: string;
  proofSubmittedAt?: Date;
  reviewedBy?: string | IUser;
  reviewedAt?: Date;
  reviewNote?: string;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification
export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_updated"
  | "payment_received"
  | "payment_failed"
  | "seat_reminder"
  | "admin_new_booking"
  | "admin_cancellation"
  | "system";

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  channel?: "line_push" | "inapp" | "email";
  deliveryStatus?: "pending" | "sent" | "failed";
  externalMessageId?: string;
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Log
export interface IAuditLog {
  _id: string;
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Idempotency
export interface IIdempotencyKey {
  _id: string;
  userId: string;
  scope: string;
  key: string;
  requestHash: string;
  status: "in_progress" | "completed" | "failed";
  responseStatus?: number;
  responseData?: unknown;
  errorMessage?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Reminder Job
export interface IReminderJob {
  _id: string;
  bookingId: string;
  userId: string;
  lineUserId?: string;
  type: "departure_24h" | "departure_1h" | "departure_daily_batch";
  runAt: Date;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  attempts: number;
  lockedAt?: Date;
  sentAt?: Date;
  lastError?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// API response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// SSE
export type SSEEventType =
  | "seat_update"
  | "notification"
  | "booking_update"
  | "timeslot_update";

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: number;
}

// Dashboard
export interface DashboardStats {
  totalBookingsToday: number;
  totalRevenue: number;
  totalPassengers: number;
  activeRoutes: number;
  recentBookings: IBooking[];
  seatOccupancy: number;
}
