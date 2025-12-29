const { MongoClient, ObjectId } = require('mongodb');
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

// Generate random gold between min and max
function getRandomGold(min = 0, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedGold() {
  let client;
  
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ Vui lòng tạo file .env.local với MONGODB_URI');
      console.error('Ví dụ: MONGODB_URI="mongodb://localhost:27017/thaybien"');
      process.exit(1);
    }

    const MONGODB_URI = process.env.MONGODB_URI;
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Đã kết nối MongoDB');

    const databaseName = getDatabaseName(MONGODB_URI);
    console.log(`📦 Sử dụng database: ${databaseName}`);
    const db = client.db(databaseName);
    
    const usersCollection = db.collection('users');
    const studentProfilesCollection = db.collection('student_profiles');

    // Find all students
    const students = await usersCollection.find({ role: 'student' }).toArray();
    console.log(`\n📊 Tìm thấy ${students.length} học sinh trong database`);

    if (students.length === 0) {
      console.log('⚠️  Không có học sinh nào để seed vàng');
      return;
    }

    let created = 0;
    let updated = 0;

    console.log('\n🪙 Đang seed tiền vàng...\n');

    for (const student of students) {
      const userId = student._id;
      const studentName = student.fullName || student.username;

      // Check if student profile exists
      let profile = await studentProfilesCollection.findOne({ userId: userId });

      if (!profile) {
        // Create new profile with random gold
        const gold = getRandomGold(0, 1000);
        await studentProfilesCollection.insertOne({
          userId: userId,
          competitionScore: 0,
          gold: gold,
          grade: null,
          group: null,
          status: 'ACTIVE',
          notes: null,
          dateOfBirth: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`   ✅ Tạo mới: ${studentName} - ${gold} vàng`);
        created++;
      } else {
        // Update existing profile with random gold
        const gold = getRandomGold(0, 1000);
        await studentProfilesCollection.updateOne(
          { _id: profile._id },
          { 
            $set: { 
              gold: gold,
              updatedAt: new Date()
            } 
          }
        );
        console.log(`   🔄 Cập nhật: ${studentName} - ${gold} vàng (trước: ${profile.gold || 0})`);
        updated++;
      }
    }

    console.log('\n📊 Tổng kết:');
    console.log(`   ✅ Đã tạo mới: ${created} profiles`);
    console.log(`   🔄 Đã cập nhật: ${updated} profiles`);
    console.log('\n🎉 Seed tiền vàng hoàn tất!');

    // Show statistics
    const stats = await studentProfilesCollection.aggregate([
      {
        $group: {
          _id: null,
          min: { $min: '$gold' },
          max: { $max: '$gold' },
          avg: { $avg: '$gold' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    if (stats.length > 0) {
      const stat = stats[0];
      console.log('\n📈 Thống kê tiền vàng:');
      console.log(`   - Vàng thấp nhất: ${Math.round(stat.min || 0)}`);
      console.log(`   - Vàng cao nhất: ${Math.round(stat.max || 0)}`);
      console.log(`   - Vàng trung bình: ${Math.round(stat.avg || 0)}`);
      console.log(`   - Tổng số học sinh: ${stat.count}`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi seed tiền vàng:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Đã đóng kết nối MongoDB');
    }
  }
}

// Run the script
seedGold();

