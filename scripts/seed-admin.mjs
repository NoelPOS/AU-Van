/**
 * Seed admin user from environment variables
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env.local
 * - If the user doesn't exist, creates them as admin
 * - If the user exists but isn't admin, promotes them
 * - If already admin, does nothing
 *
 * Usage:
 *   node scripts/seed-admin.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from .env.local
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      const value = line.slice(idx + 1).replace(/^["']|["']$/g, "");
      return [line.slice(0, idx), value];
    })
);

const MONGODB_URI = envVars.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const ADMIN_EMAIL = envVars.ADMIN_EMAIL;
const ADMIN_PASSWORD = envVars.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const users = mongoose.connection.db.collection("users");
  const email = ADMIN_EMAIL.toLowerCase().trim();

  const existing = await users.findOne({ email });

  if (existing && existing.isAdmin) {
    console.log(`Admin already exists: ${email}`);
  } else if (existing) {
    await users.updateOne({ email }, { $set: { isAdmin: true } });
    console.log(`Promoted existing user to admin: ${email}`);
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await users.insertOne({
      email,
      name: "Admin",
      password: hashedPassword,
      phone: "",
      isAdmin: true,
      authProvider: "local",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Created new admin user: ${email}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
