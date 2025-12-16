const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phucnguyenguitar';

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
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('phucnguyenguitar');
    const coursesCollection = db.collection('courses');

    // Check if courses already exist
    const existingCourses = await coursesCollection.countDocuments();
    
    if (existingCourses > 0) {
      console.log(`✅ ${existingCourses} courses already exist in database`);
      return;
    }

    // Insert courses
    const result = await coursesCollection.insertMany(courses);
    console.log(`✅ Successfully created ${result.insertedCount} courses:`);
    courses.forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

seedCourses();

