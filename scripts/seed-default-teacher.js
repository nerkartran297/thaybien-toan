const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Get database name from MONGODB_URI
function getDatabaseName(uri) {
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
  
  // Default to 'thaybien'
  return 'thaybien';
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaybien';

async function seedDefaultTeacher() {
  let client;
  
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ Vui lòng tạo file .env.local với MONGODB_URI');
      console.error('Ví dụ: MONGODB_URI="mongodb://localhost:27017/thaybien"');
      process.exit(1);
    }

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Đã kết nối MongoDB');

    const databaseName = getDatabaseName(MONGODB_URI);
    console.log(`📦 Sử dụng database: ${databaseName}`);
    const db = client.db(databaseName);
    const usersCollection = db.collection('users');

    // Default teacher credentials
    const defaultUsername = 'giaovien';
    
    // Check if teacher already exists (by username or role)
    const existingTeacher = await usersCollection.findOne({ 
      $or: [
        { username: defaultUsername },
        { role: 'teacher' }
      ]
    });
    
    if (existingTeacher) {
      console.log('✅ Tài khoản giáo viên đã tồn tại!');
      if (existingTeacher.username) {
        console.log(`Tên tài khoản: ${existingTeacher.username}`);
      }
      if (existingTeacher.email) {
        console.log(`Email: ${existingTeacher.email}`);
      }
      console.log(`Họ và tên: ${existingTeacher.fullName}`);
      return;
    }
    const defaultPassword = 'thaybien987'; // Change this in production!
    const defaultName = 'Giáo Viên';
    const defaultPhone = '0123456789';

    // Hash password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create teacher account
    const teacher = {
      username: defaultUsername,
      password: hashedPassword,
      role: 'teacher',
      fullName: defaultName,
      phone: defaultPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(teacher);
    console.log('✅ Đã tạo tài khoản giáo viên thành công!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Tên tài khoản: ${defaultUsername}`);
    console.log(`Mật khẩu: ${defaultPassword}`);
    console.log(`Họ và tên: ${defaultName}`);
    console.log(`User ID: ${result.insertedId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  QUAN TRỌNG: Đổi mật khẩu sau lần đăng nhập đầu tiên!');
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo tài khoản giáo viên:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

seedDefaultTeacher();

