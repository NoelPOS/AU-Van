/**
 * Upload LINE Rich Menu via Messaging API
 *
 * Usage:
 *   node scripts/upload-rich-menu.mjs <path-to-image>
 *
 * The image must be:
 *   - 2500x1686 pixels (matches the size in the rich menu JSON)
 *   - JPEG or PNG format
 *   - Max 1 MB
 *
 * Requires LINE_CHANNEL_ACCESS_TOKEN in .env.local
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const ACCESS_TOKEN = envVars.LINE_CHANNEL_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error("LINE_CHANNEL_ACCESS_TOKEN not found in .env.local");
  process.exit(1);
}

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("Usage: node scripts/upload-rich-menu.mjs <path-to-image>");
  console.error("  e.g. node scripts/upload-rich-menu.mjs ./rich-menu.png");
  process.exit(1);
}

const resolvedImagePath = path.resolve(imagePath);
if (!fs.existsSync(resolvedImagePath)) {
  console.error(`Image not found: ${resolvedImagePath}`);
  process.exit(1);
}

const BASE_URL = "https://api.line.me/v2/bot";
const BLOB_URL = "https://api-data.line.me/v2/bot";

const richMenuBody = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: "AU_Van_Booking_Main_Menu",
  chatBarText: "Open Menu",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: "https://au-van-booking-system.vercel.app/routes",
      },
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: {
        type: "uri",
        uri: "https://au-van-booking-system.vercel.app/mybookings",
      },
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: "https://au-van-booking-system.vercel.app/",
      },
    },
    {
      bounds: { x: 0, y: 843, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: "https://au-van-booking-system.vercel.app/notifications",
      },
    },
    {
      bounds: { x: 833, y: 843, width: 834, height: 843 },
      action: {
        type: "message",
        text: "I need help from an Admin",
      },
    },
    {
      bounds: { x: 1667, y: 843, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: "https://au-van-booking-system.vercel.app/profile",
      },
    },
  ],
};

async function main() {
  // Step 1: Create the rich menu
  console.log("Step 1/3: Creating rich menu...");
  const createRes = await fetch(`${BASE_URL}/richmenu`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(richMenuBody),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error(`Failed to create rich menu: ${createRes.status}`, err);
    process.exit(1);
  }

  const { richMenuId } = await createRes.json();
  console.log(`  Rich menu created: ${richMenuId}`);

  // Step 2: Upload the image
  console.log("Step 2/3: Uploading image...");
  const imageBuffer = fs.readFileSync(resolvedImagePath);
  const ext = path.extname(resolvedImagePath).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";

  const uploadRes = await fetch(
    `${BLOB_URL}/richmenu/${richMenuId}/content`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": contentType,
      },
      body: imageBuffer,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    console.error(`Failed to upload image: ${uploadRes.status}`, err);
    process.exit(1);
  }
  console.log("  Image uploaded successfully");

  // Step 3: Set as default rich menu for all users
  console.log("Step 3/3: Setting as default rich menu...");
  const defaultRes = await fetch(
    `${BASE_URL}/user/all/richmenu/${richMenuId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    }
  );

  if (!defaultRes.ok) {
    const err = await defaultRes.text();
    console.error(
      `Failed to set default rich menu: ${defaultRes.status}`,
      err
    );
    process.exit(1);
  }

  console.log("\nDone! Rich menu is now active for all users.");
  console.log(`  Rich Menu ID: ${richMenuId}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
