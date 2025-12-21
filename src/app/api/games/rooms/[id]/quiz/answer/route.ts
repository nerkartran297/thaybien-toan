import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { QuizAnswer, QuizSession } from '@/models/QuizSession';
import { Quiz } from '@/models/Quiz';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// POST /api/games/rooms/[id]/quiz/answer - Submit answer (student only)
export async function POST(
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

    const db = await getDatabase();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId),
    });

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can submit answers' },
        { status: 403 }
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

    const { answer } = await request.json();

    if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
      return NextResponse.json(
        { error: 'Invalid answer. Must be A, B, C, or D' },
        { status: 400 }
      );
    }

    // Get session
    const session = await db.collection('quizSessions').findOne({
      roomId: roomObjectId,
    }) as QuizSession | null;

    if (!session) {
      return NextResponse.json(
        { error: 'Quiz session not found' },
        { status: 404 }
      );
    }

    if (!session.isQuestionActive || !session.questionStartTime) {
      return NextResponse.json(
        { error: 'Question is not active' },
        { status: 400 }
      );
    }

    // Get student profile first (needed for checking existing answer and creating answer)
    const studentProfile = await db.collection('student_profiles').findOne({
      userId: new ObjectId(userId),
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Check if student already answered this question
    const existingAnswer = await db.collection('quizAnswers').findOne({
      sessionId: session._id,
      studentId: studentProfile._id,
      questionIndex: session.currentQuestionIndex,
    }) as QuizAnswer | null;

    if (existingAnswer) {
      return NextResponse.json(
        { error: 'You have already answered this question' },
        { status: 400 }
      );
    }

    // Get quiz to check correct answer
    const quiz = await db.collection('quizzes').findOne({
      _id: session.quizId,
    }) as Quiz | null;

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    const currentQuestion = quiz.questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const isCorrect = answer === currentQuestion.correctAnswer;

    // Calculate time spent
    const timeSpent = Math.floor(
      (new Date().getTime() - new Date(session.questionStartTime).getTime()) / 1000
    );

    // Calculate score: base score for correct answer + speed bonus
    // Correct answer: 100 points base
    // Speed bonus: max 50 points (faster = more points)
    // Formula: 100 (if correct) + max(0, 50 * (1 - timeSpent / timeLimit))
    let score = 0;
    if (isCorrect) {
      const speedBonus = Math.max(0, 50 * (1 - timeSpent / currentQuestion.timeLimit));
      score = 100 + speedBonus;
    }

    // Create answer record
    const quizAnswer: QuizAnswer = {
      sessionId: session._id!,
      roomId: roomObjectId,
      studentId: studentProfile._id!,
      questionIndex: session.currentQuestionIndex,
      answer,
      isCorrect,
      timeSpent,
      score,
      answeredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('quizAnswers').insertOne(quizAnswer);

    // Update or create student score
    const studentScore = await db.collection('quizStudentScores').findOne({
      sessionId: session._id,
      studentId: studentProfile._id,
    });

    if (studentScore) {
      // Update existing score
      const newTotalScore = (studentScore.totalScore || 0) + score;
      const newCorrectAnswers = (studentScore.correctAnswers || 0) + (isCorrect ? 1 : 0);
      const totalAnswered = (studentScore.totalQuestions || 0) + 1;
      const avgTime = ((studentScore.averageTimeSpent || 0) * (totalAnswered - 1) + timeSpent) / totalAnswered;

      await db.collection('quizStudentScores').updateOne(
        { _id: studentScore._id },
        {
          $set: {
            totalScore: newTotalScore,
            correctAnswers: newCorrectAnswers,
            totalQuestions: totalAnswered,
            averageTimeSpent: avgTime,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Create new score
      await db.collection('quizStudentScores').insertOne({
        sessionId: session._id,
        roomId: roomObjectId,
        studentId: studentProfile._id,
        totalScore: score,
        correctAnswers: isCorrect ? 1 : 0,
        totalQuestions: 1,
        averageTimeSpent: timeSpent,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      ...quizAnswer,
      _id: quizAnswer._id?.toString(),
      sessionId: quizAnswer.sessionId.toString(),
      roomId: quizAnswer.roomId.toString(),
      studentId: quizAnswer.studentId.toString(),
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

