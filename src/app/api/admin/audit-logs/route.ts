import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/libs/mongodb";
import AuditLog from "@/models/AuditLog";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const targetType = searchParams.get("targetType") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 30;

    await connectDB();
    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("actorId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return successResponse({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
