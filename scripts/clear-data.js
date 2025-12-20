const { MongoClient } = require('mongodb');
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

async function clearData() {
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

    // Collections to clear (but keep teachers and courses)
    const collectionsToClear = [
      'users', // Will only delete students, keep teachers
      'classes',
      'enrollments',
      'attendance',
      'absences',
      'makeups',
      'exams',
      'examAttempts',
      'quizzes',
      'quizSessions',
      'documents'
    ];

    console.log('\n🗑️  Đang xóa dữ liệu cũ...\n');

    for (const collectionName of collectionsToClear) {
      const collection = db.collection(collectionName);
      
      if (collectionName === 'users') {
        // Only delete students, keep teachers
        const result = await collection.deleteMany({ role: 'student' });
        console.log(`   ✅ Đã xóa ${result.deletedCount} học sinh từ collection users`);
      } else {
        const result = await collection.deleteMany({});
        console.log(`   ✅ Đã xóa ${result.deletedCount} documents từ collection ${collectionName}`);
      }
    }

    console.log('\n✅ Đã xóa tất cả dữ liệu cũ (giữ lại teachers và courses)');
    console.log('🎉 Bạn có thể chạy seed scripts bây giờ!');
    
  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

clearData();

