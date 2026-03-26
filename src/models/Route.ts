import mongoose, { Schema, Document, Model } from "mongoose";

export interface RouteDocument extends Document {
  from: string;
  to: string;
  slug: string;
  distance?: number;
  duration?: number;
  price: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const RouteSchema = new Schema<RouteDocument>(
  {
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    distance: { type: Number },
    duration: { type: Number },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true }
);

RouteSchema.pre("save", function (next) {
  if (this.isModified("from") || this.isModified("to") || !this.slug) {
    this.slug = `${this.from}_to_${this.to}`
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }
  next();
});

const Route: Model<RouteDocument> =
  mongoose.models.Route || mongoose.model<RouteDocument>("Route", RouteSchema);

export default Route;
