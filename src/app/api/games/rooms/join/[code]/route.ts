import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// POST /api/games/rooms/join/[code] - Join a room by code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
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
        { error: 'Only students can join rooms' },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const roomCode = resolvedParams.code;

    if (!roomCode) {
      return NextResponse.json(
        { error: 'Room code is required' },
        { status: 400 }
      );
    }

    // Get student profile
    const studentProfile = await db.collection('student_profiles').findOne({
      userId: new ObjectId(userId),
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: 'Student profile not found. Please run migration script.' },
        { status: 404 }
      );
    }

    // Find room by code
    const room = await db.collection('rooms').findOne({
      code: roomCode.toUpperCase().trim(),
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room không tồn tại' },
        { status: 404 }
      );
    }

    // Check if room is active
    if (!room.isActive) {
      return NextResponse.json(
        { error: 'Room chưa được bắt đầu' },
        { status: 400 }
      );
    }

    // Record that student has joined the room (for tracking)
    await db.collection('room_participants').updateOne(
      {
        roomId: room._id,
        studentId: studentProfile._id,
      },
      {
        $set: {
          joinedAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      roomId: room._id.toString(),
      room: {
        id: room._id.toString(),
        code: room.code,
        name: room.name,
        gameType: room.gameType || 'snake',
        startTime: room.startTime,
        endTime: room.endTime,
        duration: room.duration,
        isActive: room.isActive,
      },
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

