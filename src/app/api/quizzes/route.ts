import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Quiz, CreateQuizData, UpdateQuizData } from '@/models/Quiz';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/quizzes - Get all quizzes (teacher only)
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

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can view quizzes' },
        { status: 403 }
      );
    }

    const quizzes = await db
      .collection<Quiz>('quizzes')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const serialized = quizzes.map((quiz) => ({
      ...quiz,
      _id: quiz._id?.toString(),
      createdBy: quiz.createdBy?.toString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

// POST /api/quizzes - Create a new quiz (teacher only)
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
        { error: 'Only teachers can create quizzes' },
        { status: 403 }
      );
    }

    const data: CreateQuizData = await request.json();

    // Validate
    if (!data.name || !data.questions || data.questions.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one question are required' },
        { status: 400 }
      );
    }

    // Validate each question
    for (const question of data.questions) {
      if (!question.question || !question.options || !question.correctAnswer || !question.timeLimit) {
        return NextResponse.json(
          { error: 'Each question must have question, options, correctAnswer, and timeLimit' },
          { status: 400 }
        );
      }
    }

    const quiz: Quiz = {
      name: data.name,
      description: data.description,
      questions: data.questions,
      createdBy: new ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Quiz>('quizzes').insertOne(quiz);

    return NextResponse.json(
      {
        ...quiz,
        _id: result.insertedId.toString(),
        createdBy: quiz.createdBy.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

