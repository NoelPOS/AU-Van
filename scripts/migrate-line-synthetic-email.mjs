import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  const users = mongoose.connection.collection("users");

  const syntheticPattern = /^line_.+@line\.user$/i;
  const updateResult = await users.updateMany(
    {
      authProvider: "line",
      email: { $regex: syntheticPattern },
    },
    {
      $unset: { email: "" },
    }
  );

  const indexes = await users.indexes();
  const hasLegacyEmailIndex = indexes.some(
    (idx) => idx.name === "email_1" && !idx.partialFilterExpression
  );

  if (hasLegacyEmailIndex) {
    await users.dropIndex("email_1");
  }

  await users.createIndex(
    { email: 1 },
    {
      name: "email_1",
      unique: true,
      partialFilterExpression: { email: { $type: "string" } },
    }
  );

  console.log(
    `Migration complete. Updated ${updateResult.modifiedCount} LINE users and ensured partial unique email index.`
  );
}

run()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
