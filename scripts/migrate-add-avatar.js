import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { MongoClient } from "mongodb";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  const client = new MongoClient(uri);
  await client.connect();

  // lấy db name tương tự logic trong src/lib/mongodb.ts: nếu URI có /dbname thì dùng dbname, không có thì fallback "thaybien"
  const match = uri.match(/mongodb(\+srv)?:\/\/[^/]+\/([^?]+)/);
  const dbName = match?.[2] || "thaybien";

  const db = client.db(dbName);

  const res = await db.collection("users").updateMany(
    { avatar: { $exists: false } },
    { $set: { avatar: "/avatars/default.png" } }
  );

  console.log("✅ migrate-add-avatar done:", {
    matched: res.matchedCount,
    modified: res.modifiedCount,
  });

  await client.close();
}

run().catch((e) => {
  console.error("❌ migrate-add-avatar failed:", e);
  process.exit(1);
});
