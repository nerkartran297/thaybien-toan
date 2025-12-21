import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { QuizSession, QuizAnswer } from '@/models/QuizSession';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/rooms/[id]/quiz/stats - Get statistics for current question
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

    // Get all answers for current question
    const answers = await db
      .collection<QuizAnswer>('quizAnswers')
      .find({
        sessionId: session._id,
        questionIndex: session.currentQuestionIndex,
      })
      .toArray();

    // Calculate statistics
    const totalAnswers = answers.length;
    const stats = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
    };

    answers.forEach((answer) => {
      stats[answer.answer]++;
    });

    // Get quiz to get correct answer
    const quiz = await db.collection('quizzes').findOne({
      _id: session.quizId,
    });

    const correctAnswer = quiz
      ? (() => {
          const quizWithQuestions = quiz as { questions: Array<{ correctAnswer?: string }> };
          return quizWithQuestions.questions[session.currentQuestionIndex]?.correctAnswer;
        })()
      : null;

    // Calculate percentages
    const percentages = {
      A: totalAnswers > 0 ? Math.round((stats.A / totalAnswers) * 100) : 0,
      B: totalAnswers > 0 ? Math.round((stats.B / totalAnswers) * 100) : 0,
      C: totalAnswers > 0 ? Math.round((stats.C / totalAnswers) * 100) : 0,
      D: totalAnswers > 0 ? Math.round((stats.D / totalAnswers) * 100) : 0,
    };

    return NextResponse.json({
      questionIndex: session.currentQuestionIndex,
      totalAnswers,
      counts: stats,
      percentages,
      correctAnswer: correctAnswer || null,
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

