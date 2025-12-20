import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/rooms/joined - Get rooms that student has joined (ended rooms only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId),
    });

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can access this endpoint' },
        { status: 403 }
      );
    }

    // Get student profile
    const studentProfile = await db.collection('student_profiles').findOne({
      userId: new ObjectId(userId),
    });

    if (!studentProfile) {
      return NextResponse.json([]);
    }

    // Get all rooms that student has joined
    const participants = await db
      .collection('room_participants')
      .find({ studentId: studentProfile._id })
      .toArray();

    const roomIds = participants.map((p) => p.roomId);

    if (roomIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get room details - only ended rooms
    const now = new Date();
    const rooms = await db
      .collection('rooms')
      .find({
        _id: { $in: roomIds },
        $or: [
          { isActive: false },
          { endTime: { $lt: now } },
        ],
      })
      .sort({ endTime: -1, createdAt: -1 })
      .toArray();

    const formattedRooms = rooms.map((room) => ({
      id: room._id.toString(),
      code: room.code,
      name: room.name,
      gameType: room.gameType || 'snake',
      startTime: room.startTime,
      endTime: room.endTime,
      duration: room.duration,
      isActive: room.isActive,
      createdAt: room.createdAt,
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error('Error fetching joined rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

