import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/libs/mongodb";
import Payment from "@/models/Payment";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    await connectDB();
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate({
          path: "bookingId",
          populate: [
            { path: "routeId", select: "from to" },
            { path: "userId", select: "name email" },
          ],
        })
        .populate("userId", "name email")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return successResponse({
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
