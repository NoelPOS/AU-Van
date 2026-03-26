import { connectDB } from "@/libs/mongodb";
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
    await connectDB();
    return User.findById(id).select("-password").lean();
  }

  async getUserByEmail(email: string) {
    await connectDB();
    return User.findOne({ email: email.toLowerCase() }).lean();
  }

  async updateProfile(userId: string, updates: UpdateProfileInput) {
    await connectDB();
    return User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
      .select("-password")
      .lean();
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(input.oldPassword, user.password);
    if (!isValid) throw new Error("Current password is incorrect");

    user.password = await bcrypt.hash(input.newPassword, 10);
    await user.save();
    return true;
  }

  async deleteAccount(userId: string) {
    await connectDB();
    const result = await User.findByIdAndDelete(userId);
    if (!result) throw new Error("User not found");
    return true;
  }

  async getAllUsers(page = 1, limit = 20) {
    await connectDB();
    const [users, total] = await Promise.all([
      User.find().select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(),
    ]);
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleAdmin(userId: string) {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    user.isAdmin = !user.isAdmin;
    await user.save();
    return { isAdmin: user.isAdmin };
  }
}

export const userService = UserService.getInstance();
