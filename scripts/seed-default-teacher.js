const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phucnguyenguitar';

async function seedDefaultTeacher() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('phucnguyenguitar');
    const usersCollection = db.collection('users');

    // Check if teacher already exists
    const existingTeacher = await usersCollection.findOne({ role: 'teacher' });
    
    if (existingTeacher) {
      console.log('Teacher account already exists:');
      console.log(`Email: ${existingTeacher.email}`);
      console.log(`Name: ${existingTeacher.fullName}`);
      return;
    }

    // Default teacher credentials
    const defaultEmail = 'teacher@phucnguyenguitar.com';
    const defaultPassword = 'teacher123'; // Change this in production!
    const defaultName = 'Phúc Nguyễn';

    // Hash password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create teacher account
    const teacher = {
      email: defaultEmail,
      password: hashedPassword,
      role: 'teacher',
      fullName: defaultName,
      phone: '0123456789',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(teacher);
    console.log('✅ Default teacher account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', defaultEmail);
    console.log('🔑 Password:', defaultPassword);
    console.log('👤 Name:', defaultName);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error seeding default teacher:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

seedDefaultTeacher();

