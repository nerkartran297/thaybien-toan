import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { QuizSession } from '@/models/QuizSession';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// POST /api/games/rooms/[id]/quiz/session/start-question - Start current question (teacher only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can start questions' },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
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

    // Get session
    const session = await db.collection<QuizSession>('quizSessions').findOne({
      roomId: roomObjectId,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Quiz session not found' },
        { status: 404 }
      );
    }

    if (session.isCompleted) {
      return NextResponse.json(
        { error: 'Quiz is already completed' },
        { status: 400 }
      );
    }

    // Get quiz to check question count
    const quiz = await db.collection('quizzes').findOne({
      _id: session.quizId,
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (session.currentQuestionIndex >= (quiz as any).questions.length) {
      return NextResponse.json(
        { error: 'All questions have been completed' },
        { status: 400 }
      );
    }

    // Start the question
    await db.collection<QuizSession>('quizSessions').updateOne(
      { _id: session._id },
      {
        $set: {
          isQuestionActive: true,
          questionStartTime: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const updatedSession = await db.collection<QuizSession>('quizSessions').findOne({
      _id: session._id,
    });

    return NextResponse.json({
      ...updatedSession,
      _id: updatedSession?._id?.toString(),
      roomId: updatedSession?.roomId.toString(),
      quizId: updatedSession?.quizId.toString(),
    });
  } catch (error) {
    console.error('Error starting question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

