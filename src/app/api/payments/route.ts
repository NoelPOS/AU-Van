import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { connectDB } from "@/libs/mongodb";
import Payment from "@/models/Payment";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    await connectDB();
    const payments = await Payment.find({ userId: session!.user._id })
      .populate("bookingId", "passengerName status totalPrice")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(payments);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
