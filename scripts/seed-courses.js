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

// Define courses to seed
const courses = [
  {
    name: 'Khóa kèm 1-1 Online',
    type: '1-1',
    format: 'online',
    maxStudents: 1,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Khóa kèm 1-1 Offline',
    type: '1-1',
    format: 'offline',
    maxStudents: 1,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Khóa kèm 1-2 Online',
    type: '1-2',
    format: 'online',
    maxStudents: 2,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Khóa kèm 1-2 Offline',
    type: '1-2',
    format: 'offline',
    maxStudents: 2,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Khóa nhóm Online',
    type: 'group',
    format: 'online',
    maxStudents: 7,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Khóa nhóm Offline',
    type: 'group',
    format: 'offline',
    maxStudents: 7,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedCourses() {
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
    const coursesCollection = db.collection('courses');

    // Check if courses already exist
    const existingCourses = await coursesCollection.countDocuments();
    
    if (existingCourses > 0) {
      console.log(`\n⚠️  Đã có ${existingCourses} khóa học trong database.`);
      console.log('🗑️  Xóa các khóa học cũ...');
      await coursesCollection.deleteMany({});
      console.log('✅ Đã xóa các khóa học cũ');
    }

    // Insert courses
    console.log('\n📝 Đang tạo các khóa học...');
    const result = await coursesCollection.insertMany(courses);
    console.log(`✅ Đã tạo ${result.insertedCount} khóa học:`);
    
    courses.forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.name} (${course.type}, ${course.format}, tối đa ${course.maxStudents} học sinh)`);
    });

    console.log('\n🎉 Seed courses hoàn tất!');
    
  } catch (error) {
    console.error('❌ Lỗi khi seed courses:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

seedCourses();

