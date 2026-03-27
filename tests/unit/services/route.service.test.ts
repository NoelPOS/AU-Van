import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/models/Route", () => {
  const mockRoute = {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
  };
  return { default: mockRoute };
});

vi.mock("@/models/Booking", () => ({
  default: { countDocuments: vi.fn() },
}));

import Route from "@/models/Route";
import Booking from "@/models/Booking";
import { routeService } from "@/services/route.service";

describe("RouteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── deleteRoute ──────────────────────────────────────────────────────────

  describe("deleteRoute", () => {
    it("throws when active bookings exist on the route", async () => {
      vi.mocked(Booking.countDocuments).mockResolvedValue(5 as never);

      await expect(routeService.deleteRoute("route1")).rejects.toThrow(
        "Cannot deactivate — 5 active booking(s) exist on this route."
      );

      expect(Route.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("deactivates the route when no active bookings exist", async () => {
      vi.mocked(Booking.countDocuments).mockResolvedValue(0 as never);
      const inactive = { _id: "route1", status: "inactive" };
      vi.mocked(Route.findByIdAndUpdate).mockResolvedValue(inactive as never);

      const result = await routeService.deleteRoute("route1");

      expect(Booking.countDocuments).toHaveBeenCalledWith({
        routeId: "route1",
        status: { $nin: ["cancelled", "completed"] },
      });
      expect(Route.findByIdAndUpdate).toHaveBeenCalledWith(
        "route1",
        { status: "inactive" },
        { new: true }
      );
      expect(result).toEqual(inactive);
    });

    it("throws when route not found after passing the booking guard", async () => {
      vi.mocked(Booking.countDocuments).mockResolvedValue(0 as never);
      vi.mocked(Route.findByIdAndUpdate).mockResolvedValue(null as never);

      await expect(routeService.deleteRoute("nonexistent")).rejects.toThrow(
        "Route not found"
      );
    });

    it("counts only active statuses — cancelled and completed bookings are ignored", async () => {
      vi.mocked(Booking.countDocuments).mockResolvedValue(0 as never);
      vi.mocked(Route.findByIdAndUpdate).mockResolvedValue({ _id: "route1" } as never);

      await routeService.deleteRoute("route1");

      expect(Booking.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          status: { $nin: ["cancelled", "completed"] },
        })
      );
    });
  });
});
