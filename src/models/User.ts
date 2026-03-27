import mongoose, { Schema, Document, Model } from "mongoose";

export interface UserDocument extends Document {
  email?: string;
  password: string;
  lineUserId?: string;
  authProvider: "local" | "google" | "line";
  displayName?: string;
  pictureUrl?: string;
  lineLinkedAt?: Date;
  name: string;
  phone?: string;
  defaultPickupLocation?: string;
  profileImageUrl?: string;
  profileImageKey?: string;
  image?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    lineUserId: { type: String, unique: true, sparse: true, index: true },
    authProvider: {
      type: String,
      enum: ["local", "google", "line"],
      default: "local",
      index: true,
    },
    displayName: { type: String, trim: true },
    pictureUrl: { type: String, trim: true },
    lineLinkedAt: { type: Date },
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
    phone: { type: String, trim: true },
    defaultPickupLocation: { type: String, trim: true, maxlength: 200 },
    profileImageUrl: { type: String, trim: true },
    profileImageKey: { type: String, trim: true },
    image: { type: String },
    isAdmin: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

UserSchema.pre("validate", function (next) {
  if (this.authProvider !== "line" && !this.email) {
    this.invalidate("email", "Email is required for non-LINE accounts");
  }
  next();
});

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string" } },
  }
);

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;
