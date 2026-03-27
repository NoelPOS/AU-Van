import User from "@/models/User";
import bcrypt from "bcryptjs";
import type { UpdateProfileInput, ChangePasswordInput } from "@/validators/auth.validator";

class UserService {
  private static instance: UserService;
  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUserById(id: string) {

    return User.findById(id).select("-password").lean();
  }

  async getUserByEmail(email: string) {

    return User.findOne({ email: email.toLowerCase() }).lean();
  }

  async updateProfile(userId: string, updates: UpdateProfileInput) {

    return User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
      .select("-password")
      .lean();
  }

  async updateProfileImage(userId: string, image: { url: string; key: string }) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const previousKey = user.profileImageKey;
    user.profileImageUrl = image.url;
    user.profileImageKey = image.key;
    user.image = image.url;
    await user.save();

    const sanitized = await User.findById(userId).select("-password").lean();
    return { user: sanitized, previousKey };
  }

  async removeProfileImage(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const previousKey = user.profileImageKey;
    user.profileImageUrl = undefined;
    user.profileImageKey = undefined;
    user.image = user.pictureUrl || undefined;
    await user.save();

    const sanitized = await User.findById(userId).select("-password").lean();
    return { user: sanitized, previousKey };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(input.oldPassword, user.password);
    if (!isValid) throw new Error("Current password is incorrect");

    user.password = await bcrypt.hash(input.newPassword, 10);
    await user.save();
    return true;
  }

  async deleteAccount(userId: string) {

    const result = await User.findByIdAndDelete(userId);
    if (!result) throw new Error("User not found");
    return true;
  }

  async getAllUsers(page = 1, limit = 20) {

    const [users, total] = await Promise.all([
      User.find().select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(),
    ]);
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleAdmin(userId: string) {

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    user.isAdmin = !user.isAdmin;
    await user.save();
    return { isAdmin: user.isAdmin };
  }
}

export const userService = UserService.getInstance();
