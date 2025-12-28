import "dotenv/config";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

async function initTeacher() {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB directly
    if (!process.env.MONGODB_URI) {
      console.error("❌ Vui lòng tạo file .env với MONGODB_URI");
      console.error("Ví dụ: MONGODB_URI=\"mongodb://localhost:27017/thaybien\"");
      process.exit(1);
    }

    const uri = process.env.MONGODB_URI;
    client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Đã kết nối MongoDB");
    
    // Extract database name from MONGODB_URI or use default
    function getDatabaseName(): string {
      // If MONGODB_DB_NAME is explicitly set, use it
      if (process.env.MONGODB_DB_NAME) {
        return process.env.MONGODB_DB_NAME;
      }
      
      // Try to extract from MONGODB_URI
      // Format: mongodb://host:port/databaseName or mongodb+srv://.../databaseName
      const urlMatch = uri.match(/mongodb(\+srv)?:\/\/[^/]+\/([^?]+)/);
      if (urlMatch && urlMatch[2]) {
        return urlMatch[2];
      }
      
      // Default to 'phucnguyenguitar' to match mongodb.ts
      return 'phucnguyenguitar';
    }
    
    const databaseName = getDatabaseName();
    console.log(`📦 Sử dụng database: ${databaseName}`);
    const db = client.db(databaseName);

    const username = "giaovien";
    const password = "thaybien987";
    const fullName = "Giáo Viên";
    const phone = "0123456789";

    // Check if teacher already exists
    const existingUser = await db.collection("users").findOne({ 
      $or: [
        { username },
        { role: "teacher" }
      ]
    });

    if (existingUser) {
      console.log("✅ Tài khoản giáo viên đã tồn tại!");
      if (existingUser.username) {
        console.log(`Tên tài khoản: ${existingUser.username}`);
      }
      if (existingUser.email) {
        console.log(`Email: ${existingUser.email}`);
      }
      await client.close();
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const DEFAULT_AVATAR = "/avatars/default.png";
    // Create teacher user
    const userResult = await db.collection("users").insertOne({
      username,
      password: hashedPassword,
      fullName,
      phone,
      role: "teacher",
      avatar: DEFAULT_AVATAR,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Đã tạo tài khoản giáo viên thành công!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Tên tài khoản: ${username}`);
    console.log(`Mật khẩu: ${password}`);
    console.log(`Họ và tên: ${fullName}`);
    console.log(`User ID: ${userResult.insertedId}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  QUAN TRỌNG: Đổi mật khẩu sau lần đăng nhập đầu tiên!");

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi tạo tài khoản giáo viên:", error);
    if (client) {
      await client.close().catch(() => {});
    }
    process.exit(1);
  }
}

initTeacher();

