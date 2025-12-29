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

async function migrateAddGold() {
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

    // Find all student profiles without gold field
    const profilesWithoutGold = await studentProfilesCollection.find({
      gold: { $exists: false }
    }).toArray();

    console.log(`\n📊 Tìm thấy ${profilesWithoutGold.length} student profiles chưa có field gold`);

    if (profilesWithoutGold.length === 0) {
      console.log('✅ Tất cả student profiles đã có field gold');
      return;
    }

    // Update all profiles to add gold field with default value 0
    const result = await studentProfilesCollection.updateMany(
      { gold: { $exists: false } },
      { 
        $set: { 
          gold: 0,
          updatedAt: new Date()
        } 
      }
    );

    console.log(`\n✅ Đã thêm field gold (mặc định: 0) cho ${result.modifiedCount} student profiles`);
    console.log('🎉 Migration hoàn tất!');

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

migrateAddGold();

