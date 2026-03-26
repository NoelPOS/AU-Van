import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockProcessDueReminders } = vi.hoisted(() => ({
  mockProcessDueReminders: vi.fn(),
}));

vi.mock("@/services/reminder.service", () => ({
  reminderService: {
    processDueReminders: mockProcessDueReminders,
  },
}));

import { POST } from "@/app/api/internal/reminders/run/route";
import { GET } from "@/app/api/internal/reminders/run/route";

describe("POST /api/internal/reminders/run", () => {
  beforeEach(() => {
    process.env.REMINDER_WORKER_SECRET = "worker-secret";
    process.env.CRON_SECRET = "cron-secret";
    mockProcessDueReminders.mockReset();
  });

  it("rejects unauthorized worker requests", async () => {
    const req = new NextRequest("http://localhost/api/internal/reminders/run", {
      method: "POST",
      body: JSON.stringify({ limit: 5 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(mockProcessDueReminders).not.toHaveBeenCalled();
  });

  it("processes due reminders with valid worker secret", async () => {
    mockProcessDueReminders.mockResolvedValue({
      processedCount: 2,
      sentCount: 2,
      failedCount: 0,
      jobs: [],
    });

    const req = new NextRequest("http://localhost/api/internal/reminders/run", {
      method: "POST",
      body: JSON.stringify({ limit: 10 }),
      headers: {
        "Content-Type": "application/json",
        "x-reminder-secret": "worker-secret",
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.processedCount).toBe(2);
    expect(mockProcessDueReminders).toHaveBeenCalledWith(10);
  });

  it("processes due reminders with Vercel cron bearer token", async () => {
    mockProcessDueReminders.mockResolvedValue({
      processedCount: 1,
      sentCount: 1,
      failedCount: 0,
      jobs: [],
    });

    const req = new NextRequest("http://localhost/api/internal/reminders/run?limit=7", {
      method: "GET",
      headers: {
        authorization: "Bearer cron-secret",
      },
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.processedCount).toBe(1);
    expect(mockProcessDueReminders).toHaveBeenCalledWith(7);
  });
});
