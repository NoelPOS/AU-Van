import { NextRequest } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/validators/auth.validator";
import { successResponse, errorResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    await connectDB();
    const { name, email, password, phone } = parsed.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || "",
      isAdmin: false,
    });

    return successResponse(
      { _id: user._id, name: user.name, email: user.email },
      "Account created successfully",
      201
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
