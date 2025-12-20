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

async function migrateRoomParticipants() {
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
    
    const gameSessionsCollection = db.collection('game_sessions');
    const roomParticipantsCollection = db.collection('room_participants');

    // Get all game sessions
    const gameSessions = await gameSessionsCollection.find({}).toArray();
    console.log(`\n📊 Tìm thấy ${gameSessions.length} game sessions trong database`);

    if (gameSessions.length === 0) {
      console.log('⚠️  Không có game session nào để migrate');
      return;
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const session of gameSessions) {
      try {
        // Check if room_participant already exists
        const existingParticipant = await roomParticipantsCollection.findOne({
          roomId: session.roomId,
          studentId: session.studentId,
        });

        if (existingParticipant) {
          console.log(`⏭️  Đã có participant cho room ${session.roomId} và student ${session.studentId}`);
          skipped++;
          continue;
        }

        // Verify that roomId and studentId are valid ObjectIds
        if (!session.roomId || !session.studentId) {
          console.log(`⚠️  Game session ${session._id} thiếu roomId hoặc studentId`);
          errors++;
          continue;
        }

        let roomObjectId;
        let studentObjectId;

        try {
          roomObjectId = session.roomId instanceof ObjectId ? session.roomId : new ObjectId(session.roomId);
          studentObjectId = session.studentId instanceof ObjectId ? session.studentId : new ObjectId(session.studentId);
        } catch (e) {
          console.log(`⚠️  Game session ${session._id} có roomId hoặc studentId không hợp lệ:`, e.message);
          errors++;
          continue;
        }

        // Verify room exists
        const room = await db.collection('rooms').findOne({ _id: roomObjectId });
        if (!room) {
          console.log(`⚠️  Room ${roomObjectId} không tồn tại cho session ${session._id}`);
          errors++;
          continue;
        }

        // Verify student profile exists
        const studentProfile = await db.collection('student_profiles').findOne({ _id: studentObjectId });
        if (!studentProfile) {
          console.log(`⚠️  Student profile ${studentObjectId} không tồn tại cho session ${session._id}`);
          errors++;
          continue;
        }

        // Create room participant record
        const participant = {
          roomId: roomObjectId,
          studentId: studentObjectId,
          joinedAt: session.createdAt || new Date(),
          createdAt: session.createdAt || new Date(),
          updatedAt: new Date(),
        };

        await roomParticipantsCollection.insertOne(participant);
        console.log(`✅ Đã tạo participant cho room ${roomObjectId} và student ${studentObjectId}`);
        created++;
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý session ${session._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Kết quả migrate:');
    console.log(`   ✅ Đã tạo mới: ${created} participants`);
    console.log(`   ⏭️  Đã bỏ qua: ${skipped} participants (đã tồn tại)`);
    console.log(`   ❌ Lỗi: ${errors} sessions`);
    console.log(`   📝 Tổng cộng: ${gameSessions.length} game sessions`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Also check for rooms that might have participants but no game_sessions
    const roomsCollection = db.collection('rooms');
    const allRooms = await roomsCollection.find({}).toArray();
    
    console.log(`\n🔍 Kiểm tra ${allRooms.length} rooms...`);
    let roomsWithParticipants = 0;
    
    for (const room of allRooms) {
      const participantCount = await roomParticipantsCollection.countDocuments({
        roomId: room._id,
      });
      
      if (participantCount > 0) {
        roomsWithParticipants++;
        console.log(`   📊 Room "${room.name}" (${room.code}): ${participantCount} participants`);
      }
    }
    
    console.log(`\n✅ Tổng cộng ${roomsWithParticipants} rooms có participants`);

    console.log('\n✅ Hoàn thành migrate room participants!');
    
  } catch (error) {
    console.error('❌ Lỗi khi migrate room participants:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

migrateRoomParticipants();

