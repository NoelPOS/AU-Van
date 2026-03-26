import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectDB } from "@/libs/mongodb";
import { unauthorizedResponse, forbiddenResponse } from "./api-response";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return { session: null, error: unauthorizedResponse() };
  }
  await connectDB();
  return { session, error: null };
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return { session: null, error: unauthorizedResponse() };
  }
  if (!session.user.isAdmin) {
    return { session: null, error: forbiddenResponse("Admin access required") };
  }
  await connectDB();
  return { session, error: null };
}
