import { requireAuth } from "@/lib/auth-guard";
import { userService } from "@/services/user.service";
import { deleteProfileImageFile, saveProfileImageFile } from "@/lib/storage/profile-image-storage";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const formData = await req.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) {
      return errorResponse("Image file is required");
    }

    const saved = await saveProfileImageFile(image, session!.user._id);
    const { user, previousKey } = await userService.updateProfileImage(session!.user._id, saved);

    if (previousKey && previousKey !== saved.key) {
      void deleteProfileImageFile(previousKey).catch((cleanupError) => {
        console.error("Profile image cleanup failed:", cleanupError);
      });
    }

    return successResponse(user, "Profile image updated");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}

export async function DELETE() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { user, previousKey } = await userService.removeProfileImage(session!.user._id);
    if (previousKey) {
      void deleteProfileImageFile(previousKey).catch((cleanupError) => {
        console.error("Profile image delete failed:", cleanupError);
      });
    }

    return successResponse(user, "Profile image removed");
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return serverErrorResponse(err);
  }
}
