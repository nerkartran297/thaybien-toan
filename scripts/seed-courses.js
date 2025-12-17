const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Get database name from MONGODB_URI
function getDatabaseName(uri) {
  if (process.env.MONGODB_DB_NAME) {
    return process.env.MONGODB_DB_NAME;
  }
  const urlMatch = uri.match(/mongodb(\+srv)?:\/\/[^/]+\/([^?]+)/);
  if (urlMatch && urlMatch[2]) {
    return urlMatch[2];
  }
  return 'thaybien';
}

const courses = [
  {
    name: 'Khóa kèm 1-1 Online',
    type: '1-1',
    format: 'online',
    maxStudents: 1,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Khóa kèm 1-1 Offline',
    type: '1-1',
    format: 'offline',
    maxStudents: 1,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Khóa kèm 1-2 Online',
    type: '1-2',
    format: 'online',
    maxStudents: 2,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Khóa kèm 1-2 Offline',
    type: '1-2',
    format: 'offline',
    maxStudents: 2,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Khóa nhóm online',
    type: 'group',
    format: 'online',
    maxStudents: 7,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Khóa nhóm offline',
    type: 'group',
    format: 'offline',
    maxStudents: 7,
    totalSessions: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seedCourses() {
  let client;
  
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ Vui lòng tạo file .env.local với MONGODB_URI');
      process.exit(1);
    }

    const uri = process.env.MONGODB_URI;
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Đã kết nối MongoDB');

    const databaseName = getDatabaseName(uri);
    console.log(`📦 Sử dụng database: ${databaseName}`);
    const db = client.db(databaseName);
    const coursesCollection = db.collection('courses');

    // Check if courses already exist
    const existingCourses = await coursesCollection.countDocuments();
    
    if (existingCourses > 0) {
      console.log(`✅ Đã có ${existingCourses} courses trong database`);
      return;
    }

    // Insert courses
    const result = await coursesCollection.insertMany(courses);
    console.log(`✅ Đã tạo ${result.insertedCount} courses:`);
    courses.forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.name}`);
    });
    
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

