import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/rooms - Get all rooms (for teachers) or active rooms (for students)
export async function GET() {
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For teachers, return all rooms
    // For students, return only active rooms
    const query: { isActive?: boolean } = {};
    if (user.role !== 'teacher') {
      query.isActive = true;
    }

    const rooms = await db
      .collection('rooms')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const formattedRooms = rooms.map((room: any) => ({
      id: room._id.toString(),
      code: room.code,
      name: room.name,
      activityType: room.activityType || room.gameType || 'snake',
      gameType: room.activityType || room.gameType || 'snake', // Keep for backward compatibility
      startTime: room.startTime,
      endTime: room.endTime,
      duration: room.duration,
      isActive: room.isActive,
      createdAt: room.createdAt,
      examId: (room as any).examId?.toString(),
      quizId: (room as any).quizId?.toString(),
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/games/rooms - Create a new room (teacher only)
export async function POST(request: NextRequest) {
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

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can create rooms' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, activityType, gameType, startTime, endTime, duration, examId, quizId } = body;

    // Support both old (gameType) and new (activityType) for backward compatibility
    const finalActivityType = activityType || gameType || 'snake';

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate examId if activityType is exam
    if (finalActivityType === 'exam' && !examId) {
      return NextResponse.json(
        { error: 'Exam ID is required for exam activities' },
        { status: 400 }
      );
    }

    // Validate quizId if activityType is quiz
    if (finalActivityType === 'quiz' && !quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required for quiz activities' },
        { status: 400 }
      );
    }

    // Calculate duration from startTime and endTime if not provided
    let calculatedDuration = duration;
    if (!calculatedDuration && startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime();
      calculatedDuration = Math.max(1, Math.floor(diffMs / (1000 * 60))); // Convert to minutes, minimum 1 minute
    } else if (!calculatedDuration) {
      calculatedDuration = 60; // Default 60 minutes if no duration and no endTime
    }

    // Generate unique room code (6 characters)
    const generateRoomCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let roomCode = generateRoomCode();
    // Ensure code is unique
    let existingRoom = await db.collection('rooms').findOne({ code: roomCode });
    while (existingRoom) {
      roomCode = generateRoomCode();
      existingRoom = await db.collection('rooms').findOne({ code: roomCode });
    }

    const room: any = {
      code: roomCode,
      name,
      activityType: finalActivityType,
      gameType: finalActivityType, // Keep for backward compatibility
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      duration: parseInt(String(calculatedDuration)),
      isActive: false,
      teacherId: new ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add examId if activityType is exam
    if (finalActivityType === 'exam' && examId) {
      room.examId = new ObjectId(examId);
    }

    // Add quizId if activityType is quiz
    if (finalActivityType === 'quiz' && quizId) {
      room.quizId = new ObjectId(quizId);
    }

    const result = await db.collection('rooms').insertOne(room);

    return NextResponse.json({
      id: result.insertedId.toString(),
      code: roomCode,
      name,
      activityType: room.activityType,
      gameType: room.activityType, // Keep for backward compatibility
      startTime: room.startTime,
      endTime: room.endTime,
      duration: room.duration,
      isActive: room.isActive,
      examId: room.examId?.toString(),
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

