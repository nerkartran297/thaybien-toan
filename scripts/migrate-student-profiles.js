const { MongoClient, ObjectId } = require('mongodb');
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

async function migrateStudentProfiles() {
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
    const studentProfilesCollection = db.collection('student_profiles');

    // Find all students (users with role = 'student')
    const students = await usersCollection.find({ role: 'student' }).toArray();
    console.log(`\n📊 Tìm thấy ${students.length} học sinh trong database`);

    if (students.length === 0) {
      console.log('⚠️  Không có học sinh nào để migrate');
      return;
    }

    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const student of students) {
      // Check if student profile already exists
      const existingProfile = await studentProfilesCollection.findOne({
        userId: student._id,
      });

      if (existingProfile) {
        console.log(`⏭️  Đã có profile cho học sinh: ${student.fullName || student.username} (${student._id})`);
        skipped++;
        
        // Update userId if it's missing or incorrect
        if (!existingProfile.userId || existingProfile.userId.toString() !== student._id.toString()) {
          await studentProfilesCollection.updateOne(
            { _id: existingProfile._id },
            {
              $set: {
                userId: student._id,
                updatedAt: new Date(),
              },
            }
          );
          console.log(`   ✅ Đã cập nhật userId cho profile`);
          updated++;
        }
        continue;
      }

      // Create new student profile
      const studentProfile = {
        userId: student._id,
        competitionScore: 0,
        status: 'PENDING', // Default status
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add optional fields if they exist in user
      if (student.dateOfBirth) {
        studentProfile.dateOfBirth = new Date(student.dateOfBirth);
      }
      if (student.note) {
        studentProfile.notes = student.note;
      }
      if (student.grade) {
        studentProfile.grade = student.grade;
      }
      if (student.group) {
        studentProfile.group = student.group;
      }

      await studentProfilesCollection.insertOne(studentProfile);
      console.log(`✅ Đã tạo profile cho học sinh: ${student.fullName || student.username} (${student._id})`);
      created++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Kết quả migrate:');
    console.log(`   ✅ Đã tạo mới: ${created} profiles`);
    console.log(`   ⏭️  Đã bỏ qua: ${skipped} profiles (đã tồn tại)`);
    console.log(`   🔄 Đã cập nhật: ${updated} profiles`);
    console.log(`   📝 Tổng cộng: ${students.length} học sinh`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Also check for game_sessions that might have invalid studentId references
    const gameSessionsCollection = db.collection('game_sessions');
    const gameSessions = await gameSessionsCollection.find({}).toArray();
    
    if (gameSessions.length > 0) {
      console.log(`\n🔍 Kiểm tra ${gameSessions.length} game sessions...`);
      let invalidSessions = 0;
      
      for (const session of gameSessions) {
        if (!session.studentId) continue;
        
        const profile = await studentProfilesCollection.findOne({
          _id: session.studentId,
        });
        
        if (!profile) {
          // Try to find by userId
          const user = await usersCollection.findOne({ _id: session.studentId });
          if (user && user.role === 'student') {
            // Create profile for this user
            const newProfile = {
              userId: user._id,
              competitionScore: 0,
              status: 'PENDING',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            const profileResult = await studentProfilesCollection.insertOne(newProfile);
            
            // Update game_session to use the new profile _id
            await gameSessionsCollection.updateOne(
              { _id: session._id },
              { $set: { studentId: profileResult.insertedId } }
            );
            
            console.log(`   ✅ Đã tạo profile và cập nhật game session cho user: ${user.fullName || user.username}`);
            invalidSessions++;
          } else {
            console.log(`   ⚠️  Game session ${session._id} có studentId không hợp lệ: ${session.studentId}`);
          }
        }
      }
      
      if (invalidSessions > 0) {
        console.log(`\n✅ Đã sửa ${invalidSessions} game sessions có studentId không hợp lệ`);
      }
    }

    console.log('\n✅ Hoàn thành migrate student profiles!');
    
  } catch (error) {
    console.error('❌ Lỗi khi migrate student profiles:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

migrateStudentProfiles();

