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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaybien';

async function migrateToSeasonalScores() {
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
    
    const studentProfilesCollection = db.collection('student_profiles');

    // Find all student profiles
    const profiles = await studentProfilesCollection.find({}).toArray();
    console.log(`\n📊 Tìm thấy ${profiles.length} student profiles`);

    if (profiles.length === 0) {
      console.log('⚠️  Không có student profiles nào để migrate');
      return;
    }

    let migrated = 0;
    let skipped = 0;

    console.log('\n🔄 Đang migrate sang hệ thống điểm theo mùa...\n');

    for (const profile of profiles) {
      // Check if already migrated
      if (profile.lifetimeScore !== undefined && profile.seasonalScores !== undefined) {
        console.log(`   ⏭️  Đã migrate: ${profile._id}`);
        skipped++;
        continue;
      }

      // Get current competitionScore (hoặc 0 nếu không có)
      const currentScore = profile.competitionScore || 0;
      
      // Migrate: competitionScore → lifetimeScore, và tạo seasonalScores với mùa đầu tiên
      const updateData = {
        lifetimeScore: currentScore,
        seasonalScores: [currentScore], // Mùa đầu tiên = điểm hiện tại
        currentSeason: 1,
        updatedAt: new Date(),
      };

      // Nếu chưa có gold, set mặc định 0
      if (profile.gold === undefined) {
        updateData.gold = 0;
      }

      await studentProfilesCollection.updateOne(
        { _id: profile._id },
        { $set: updateData }
      );

      console.log(`   ✅ Migrated: ${profile._id} - lifetimeScore: ${currentScore}, seasonalScores: [${currentScore}]`);
      migrated++;
    }

    console.log('\n📊 Tổng kết:');
    console.log(`   ✅ Đã migrate: ${migrated} profiles`);
    console.log(`   ⏭️  Đã bỏ qua: ${skipped} profiles`);
    console.log('\n🎉 Migration hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi khi migration:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Đã đóng kết nối MongoDB');
    }
  }
}

migrateToSeasonalScores();

