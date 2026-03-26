import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { userService } from "@/services/user.service";
import { updateProfileSchema, changePasswordSchema } from "@/validators/auth.validator";
import { successResponse, errorResponse, serverErrorResponse, validationErrorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const user = await userService.getUserById(session!.user._id);
    return successResponse(user);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();

    // Check if password change or profile update
    if (body.oldPassword) {
      const parsed = changePasswordSchema.safeParse(body);
      if (!parsed.success) {
        return validationErrorResponse(parsed.error.flatten().fieldErrors);
      }
      await userService.changePassword(session!.user._id, parsed.data);
      return successResponse(null, "Password changed successfully");
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const user = await userService.updateProfile(session!.user._id, parsed.data);
    return successResponse(user, "Profile updated");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}

export async function DELETE() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    await userService.deleteAccount(session!.user._id);
    return successResponse(null, "Account deleted");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
