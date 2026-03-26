import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  mockRequireAuth,
  mockStartRequest,
  mockCompleteRequest,
  mockFailRequest,
  mockCreateBooking,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockStartRequest: vi.fn(),
  mockCompleteRequest: vi.fn(),
  mockFailRequest: vi.fn(),
  mockCreateBooking: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("@/services/idempotency.service", () => ({
  idempotencyService: {
    startRequest: mockStartRequest,
    completeRequest: mockCompleteRequest,
    failRequest: mockFailRequest,
  },
}));

vi.mock("@/services/booking.service", () => ({
  bookingService: {
    createBooking: mockCreateBooking,
  },
}));

import { POST } from "@/app/api/liff/bookings/route";

const validBookingPayload = {
  routeId: "route-1",
  timeslotId: "timeslot-1",
  seatIds: ["seat-1"],
  passengerName: "John Doe",
  passengerPhone: "0812345678",
  pickupLocation: "Dorm A",
  paymentMethod: "promptpay",
  sourceChannel: "liff",
};

describe("POST /api/liff/bookings idempotency", () => {
  beforeEach(() => {
    mockRequireAuth.mockResolvedValue({
      session: { user: { _id: "user-1" } },
      error: null,
    });
    mockStartRequest.mockReset();
    mockCompleteRequest.mockReset();
    mockFailRequest.mockReset();
    mockCreateBooking.mockReset();
  });

  it("returns replay response when idempotency service reports replay", async () => {
    mockStartRequest.mockResolvedValue({
      mode: "replay",
      statusCode: 200,
      data: { _id: "booking-replay" },
    });

    const req = new NextRequest("http://localhost/api/liff/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "abc-123",
      },
      body: JSON.stringify(validBookingPayload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data._id).toBe("booking-replay");
    expect(mockCreateBooking).not.toHaveBeenCalled();
    expect(mockCompleteRequest).not.toHaveBeenCalled();
  });

  it("creates booking and stores idempotent result for new key", async () => {
    mockStartRequest.mockResolvedValue({
      mode: "new",
      recordId: "idem-1",
    });
    mockCreateBooking.mockResolvedValue({ _id: "booking-new", status: "pending_payment" });

    const req = new NextRequest("http://localhost/api/liff/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "abc-456",
      },
      body: JSON.stringify(validBookingPayload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockCreateBooking).toHaveBeenCalledOnce();
    expect(mockCompleteRequest).toHaveBeenCalledWith(
      "idem-1",
      { _id: "booking-new", status: "pending_payment" },
      201
    );
  });
});
