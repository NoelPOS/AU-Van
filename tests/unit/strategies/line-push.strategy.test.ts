import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/line-messaging", () => ({
  sendLinePushMessage: vi.fn(),
}));

import { sendLinePushMessage } from "@/lib/line-messaging";
import { LinePushNotificationStrategy } from "@/strategies/notification/line-push.strategy";

describe("LinePushNotificationStrategy", () => {
  const strategy = new LinePushNotificationStrategy();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips when lineUserId is missing", async () => {
    const result = await strategy.send({
      userId: "user-1",
      type: "booking_confirmed",
      title: "Booking Confirmed",
      message: "ok",
    });

    expect(result.deliveryStatus).toBe("skipped");
    expect(sendLinePushMessage).not.toHaveBeenCalled();
  });

  it("falls back to text when rich push fails", async () => {
    vi.mocked(sendLinePushMessage)
      .mockResolvedValueOnce({ ok: false, status: 500, error: "rich failed" })
      .mockResolvedValueOnce({ ok: true, status: 200, requestId: "req-2" });

    const result = await strategy.send({
      userId: "user-1",
      lineUserId: "line-user-1",
      type: "booking_confirmed",
      title: "Booking Confirmed",
      message: "Trip confirmed",
      data: { routeFrom: "AU", routeTo: "City", date: "2026-03-27", time: "08:00" },
    });

    expect(sendLinePushMessage).toHaveBeenCalledTimes(2);
    expect(result.deliveryStatus).toBe("sent");
    expect(result.externalMessageId).toBe("req-2");
  });

  it("sends admin notifications as plain text", async () => {
    vi.mocked(sendLinePushMessage).mockResolvedValueOnce({ ok: true, status: 200, requestId: "req-admin" });

    const result = await strategy.send({
      userId: "admin-1",
      lineUserId: "line-admin-1",
      type: "admin_new_booking",
      title: "Admin",
      message: "New booking",
    });

    expect(sendLinePushMessage).toHaveBeenCalledTimes(1);
    expect(result.deliveryStatus).toBe("sent");
  });
});
