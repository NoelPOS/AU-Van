/**
 * Seed realistic mock routes + timeslots + seats for quick manual testing.
 *
 * Usage:
 *   node scripts/seed-mock-data.mjs
 *   node scripts/seed-mock-data.mjs --days 21
 *   node scripts/seed-mock-data.mjs --reset
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.resolve(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error(".env.local not found");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = Object.fromEntries(
  envContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      const key = line.slice(0, idx);
      const value = line.slice(idx + 1).replace(/^["']|["']$/g, "");
      return [key, value];
    })
);

const MONGODB_URI = envVars.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const shouldReset = args.includes("--reset");
const daysIndex = args.indexOf("--days");
const daysToSeed =
  daysIndex >= 0 ? Math.max(1, Number.parseInt(args[daysIndex + 1] || "14", 10)) : 14;

const DEFAULT_TOTAL_SEATS = 16;
const FROM_LOCATION = "Assumption University";

const ROUTE_TEMPLATES = [
  { to: "Siam Paragon", price: 60, distance: 33, duration: 65 },
  { to: "Mega Bangna", price: 35, distance: 18, duration: 35 },
  { to: "Victory Monument", price: 70, distance: 36, duration: 75 },
  { to: "BTS Udom Suk", price: 45, distance: 23, duration: 45 },
  { to: "Future Park Rangsit", price: 75, distance: 42, duration: 80 },
];

function slugify(from, to) {
  return `${from}_to_${to}`
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generateSeatLabel(index) {
  const row = Math.floor(index / 4) + 1;
  const col = String.fromCharCode(65 + (index % 4));
  return `${row}${col}`;
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTimesForDate(date) {
  const day = date.getDay(); // 0=Sun, 6=Sat
  const weekend = day === 0 || day === 6;
  if (weekend) return ["08:30", "11:30", "14:30", "17:30"];
  return ["07:00", "09:00", "12:00", "15:00", "18:00", "20:00"];
}

function computeBookedSeatCount(seedKey, time, totalSeats) {
  const hash = hashString(seedKey);
  const peakTime = time === "07:00" || time === "18:00" || time === "20:00";
  const baseRatio = peakTime ? 0.62 : 0.35;
  const variance = ((hash % 41) - 20) / 100; // -0.20..0.20
  const ratio = Math.min(0.95, Math.max(0.08, baseRatio + variance));
  const maybeFull = hash % 17 === 0;
  if (maybeFull) return totalSeats;
  return Math.max(1, Math.min(totalSeats - 1, Math.round(totalSeats * ratio)));
}

function buildSeats(timeslotId, totalSeats, bookedSeats) {
  return Array.from({ length: totalSeats }, (_, i) => ({
    timeslotId,
    seatNumber: i + 1,
    label: generateSeatLabel(i),
    status: i < bookedSeats ? "booked" : "available",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

async function resetMockData(db, routeSlugs) {
  const routes = db.collection("routes");
  const timeslots = db.collection("timeslots");
  const seats = db.collection("seats");

  const mockRoutes = await routes.find({ slug: { $in: routeSlugs } }).project({ _id: 1 }).toArray();
  const routeIds = mockRoutes.map((r) => r._id);
  if (routeIds.length === 0) return;

  const slots = await timeslots.find({ routeId: { $in: routeIds } }).project({ _id: 1 }).toArray();
  const slotIds = slots.map((s) => s._id);

  if (slotIds.length > 0) {
    await seats.deleteMany({ timeslotId: { $in: slotIds } });
  }
  await timeslots.deleteMany({ routeId: { $in: routeIds } });
  await routes.deleteMany({ _id: { $in: routeIds } });
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const routes = db.collection("routes");
  const timeslots = db.collection("timeslots");
  const seats = db.collection("seats");

  const routeSlugs = ROUTE_TEMPLATES.map((r) => slugify(FROM_LOCATION, r.to));

  if (shouldReset) {
    await resetMockData(db, routeSlugs);
    console.log("Mock routes/timeslots/seats removed.");
    await mongoose.disconnect();
    return;
  }

  let createdRoutes = 0;
  let reusedRoutes = 0;
  let createdTimeslots = 0;
  let reusedTimeslots = 0;
  let createdSeats = 0;

  const routeDocs = [];

  for (const routeTemplate of ROUTE_TEMPLATES) {
    const slug = slugify(FROM_LOCATION, routeTemplate.to);
    const updateResult = await routes.updateOne(
      { slug },
      {
        $setOnInsert: {
          from: FROM_LOCATION,
          to: routeTemplate.to,
          slug,
          price: routeTemplate.price,
          distance: routeTemplate.distance,
          duration: routeTemplate.duration,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    if (updateResult.upsertedCount > 0) createdRoutes += 1;
    else reusedRoutes += 1;

    const route = await routes.findOne({ slug });
    routeDocs.push(route);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const route of routeDocs) {
    for (let dayOffset = 0; dayOffset < daysToSeed; dayOffset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dateStr = formatDateLocal(date);

      for (const time of getTimesForDate(date)) {
        const filter = { routeId: route._id, date: dateStr, time };
        const upsertResult = await timeslots.updateOne(
          filter,
          {
            $setOnInsert: {
              routeId: route._id,
              date: dateStr,
              time,
              totalSeats: DEFAULT_TOTAL_SEATS,
              bookedSeats: 0,
              status: "active",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );

        const timeslot = await timeslots.findOne(filter);

        if (upsertResult.upsertedCount > 0) {
          createdTimeslots += 1;

          const bookedSeats = computeBookedSeatCount(
            `${route.slug}:${dateStr}:${time}`,
            time,
            DEFAULT_TOTAL_SEATS
          );
          const status = bookedSeats >= DEFAULT_TOTAL_SEATS ? "full" : "active";

          await timeslots.updateOne(
            { _id: timeslot._id },
            {
              $set: {
                bookedSeats,
                status,
                updatedAt: new Date(),
              },
            }
          );

          const seatDocs = buildSeats(timeslot._id, DEFAULT_TOTAL_SEATS, bookedSeats);
          if (seatDocs.length > 0) {
            await seats.insertMany(seatDocs, { ordered: true });
            createdSeats += seatDocs.length;
          }
        } else {
          reusedTimeslots += 1;

          const seatCount = await seats.countDocuments({ timeslotId: timeslot._id });
          if (seatCount === 0) {
            const bookedSeats = Number(timeslot.bookedSeats || 0);
            const totalSeats = Number(timeslot.totalSeats || DEFAULT_TOTAL_SEATS);
            const seatDocs = buildSeats(timeslot._id, totalSeats, bookedSeats);
            await seats.insertMany(seatDocs, { ordered: true });
            createdSeats += seatDocs.length;
          }
        }
      }
    }
  }

  console.log("Mock seed complete.");
  console.log(`Routes: created=${createdRoutes}, reused=${reusedRoutes}`);
  console.log(`Timeslots: created=${createdTimeslots}, reused=${reusedTimeslots}`);
  console.log(`Seats created=${createdSeats}`);
  console.log(`Days seeded=${daysToSeed}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed error:", err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});

