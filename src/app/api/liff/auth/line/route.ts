import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextRequest } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/User";
import { verifyLineIdToken } from "@/lib/line-auth";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/api-response";

const lineAuthSchema = z.object({
  idToken: z.string().min(1),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = lineAuthSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const verified = await verifyLineIdToken(parsed.data.idToken);

    await connectDB();
    const lineUserId = verified.sub;
    const verifiedEmail = verified.email?.toLowerCase();
    const fallbackEmail = `line_${lineUserId}@line.user`;
    const displayName =
      verified.name || parsed.data.displayName || "LINE User";
    const avatar = verified.picture || parsed.data.avatar || "";

    const query = verifiedEmail
      ? { $or: [{ lineUserId }, { email: verifiedEmail }] }
      : { lineUserId };

    let user = await User.findOne(query);
    if (!user) {
      user = await User.create({
        email: verifiedEmail || fallbackEmail,
        password: await bcrypt.hash(crypto.randomUUID(), 10),
        name: displayName,
        image: avatar,
        lineUserId,
        authProvider: "line",
        displayName,
        pictureUrl: avatar,
        lineLinkedAt: new Date(),
        isAdmin: false,
      });
    } else {
      user.lineUserId = user.lineUserId || lineUserId;
      user.authProvider = user.authProvider || "line";
      user.displayName = user.displayName || displayName;
      user.pictureUrl = user.pictureUrl || avatar;
      user.image = user.image || avatar;
      user.lineLinkedAt = user.lineLinkedAt || new Date();
      await user.save();
    }

    return successResponse({
      userId: String(user._id),
      lineUserId,
      displayName: user.displayName || user.name,
      email: user.email,
    });
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
