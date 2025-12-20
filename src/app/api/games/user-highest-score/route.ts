import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/user-highest-score - Get user's highest score for a room
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

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get student profile
    const studentProfile = await db.collection('student_profiles').findOne({
      userId: new ObjectId(userId),
    });

    if (!studentProfile) {
      return NextResponse.json({ highestScore: 0 });
    }

    const studentId = studentProfile._id;

    // Get game session for this room
    const gameSession = await db.collection('game_sessions').findOne({
      roomId: new ObjectId(roomId),
      studentId: studentId,
    });

    return NextResponse.json({
      highestScore: gameSession?.highestScore || 0,
    });
  } catch (error) {
    console.error('Error fetching user highest score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

