import mongoose, { Schema, Document, Model } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  password: string;
  lineUserId?: string;
  authProvider: "local" | "google" | "line";
  displayName?: string;
  pictureUrl?: string;
  lineLinkedAt?: Date;
  name: string;
  phone?: string;
  image?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
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
    image: { type: String },
    isAdmin: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;
