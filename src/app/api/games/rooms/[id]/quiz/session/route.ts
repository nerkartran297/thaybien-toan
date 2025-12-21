import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { QuizSession } from '@/models/QuizSession';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/rooms/[id]/quiz/session - Get or create quiz session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const resolvedParams = await params;
    const roomId = resolvedParams.id;

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    let roomObjectId: ObjectId;
    try {
      roomObjectId = new ObjectId(roomId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get room to check quizId
    const room = await db.collection('rooms').findOne({
      _id: roomObjectId,
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const roomWithActivity = room as { activityType?: string; gameType?: string; quizId?: ObjectId };
    const activityType = roomWithActivity.activityType || roomWithActivity.gameType;
    if (activityType !== 'quiz') {
      return NextResponse.json(
        { error: 'This room is not a quiz room' },
        { status: 400 }
      );
    }

    const quizId = roomWithActivity.quizId;
    if (!quizId) {
      return NextResponse.json(
        { error: 'Room does not have a quiz assigned' },
        { status: 400 }
      );
    }

    // Get or create quiz session
    let session = await db.collection('quizSessions').findOne({
      roomId: roomObjectId,
    }) as QuizSession | null;

    if (!session) {
      // Create new session
      const newSession: QuizSession = {
        roomId: roomObjectId,
        quizId: typeof quizId === 'string' ? new ObjectId(quizId) : quizId,
        currentQuestionIndex: 0,
        isQuestionActive: false,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('quizSessions').insertOne(newSession);
      session = { ...newSession, _id: result.insertedId };
    }

    return NextResponse.json({
      ...session,
      _id: session._id?.toString(),
      roomId: session.roomId.toString(),
      quizId: session.quizId.toString(),
    });
  } catch (error) {
    console.error('Error fetching quiz session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


