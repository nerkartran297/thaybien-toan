import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ExamAttempt, CreateExamAttemptData } from '@/models/ExamAttempt';
import { Exam } from '@/models/Exam';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Helper to verify student authentication
async function verifyStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      return null;
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (user && user.role === 'student') {
      return { userId, user };
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Helper to verify teacher authentication
async function verifyTeacher() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      return null;
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (user && user.role === 'teacher') {
      return { userId, user };
    }

    return null;
  } catch (error) {
    return null;
  }
}

// GET /api/exam-attempts - Get exam attempts (filtered by student or examId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const role = searchParams.get('role');
      const db = await getDatabase();

    // Check if teacher is requesting all attempts for an exam
    if (role === 'teacher' && examId) {
      const auth = await verifyTeacher();
      if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get all submitted attempts for this exam
      const attempts = await db
        .collection<ExamAttempt>('examAttempts')
        .find({
          examId: new ObjectId(examId),
          submittedAt: { $exists: true, $ne: null },
        })
        .sort({ score: -1, submittedAt: -1 }) // Sort by score descending
        .toArray();

      // Serialize ObjectIds
      const serialized = attempts.map((attempt) => ({
        ...attempt,
        _id: attempt._id?.toString(),
        examId: attempt.examId?.toString(),
        studentId: attempt.studentId?.toString(),
      }));

      return NextResponse.json(serialized);
    }

    // Default: student getting their own attempts
    const auth = await verifyStudent();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query: any = { studentId: new ObjectId(auth.userId) };
    if (examId) {
      query.examId = new ObjectId(examId);
    }

    const attempts = await db
      .collection<ExamAttempt>('examAttempts')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Serialize ObjectIds
    const serialized = attempts.map((attempt) => ({
      ...attempt,
      _id: attempt._id?.toString(),
      examId: attempt.examId?.toString(),
      studentId: attempt.studentId?.toString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching exam attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam attempts' },
      { status: 500 }
    );
  }
}

// POST /api/exam-attempts - Create new exam attempt (start exam)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStudent();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateExamAttemptData = await request.json();
    const db = await getDatabase();

    // Verify exam exists and get total questions
    const exam = await db
      .collection<Exam>('exams')
      .findOne({ _id: new ObjectId(data.examId) });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (!exam.answers || exam.answers.length === 0) {
      return NextResponse.json(
        { error: 'Exam does not have answers configured' },
        { status: 400 }
      );
    }

    const totalQuestions = exam.answers.length;

    // Initialize answers array with null values
    const initialAnswers: (string | null)[] = new Array(totalQuestions).fill(null);

    const attempt: ExamAttempt = {
      examId: new ObjectId(data.examId),
      studentId: new ObjectId(auth.userId),
      answers: initialAnswers,
      totalQuestions,
      startedAt: new Date(data.startedAt),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<ExamAttempt>('examAttempts').insertOne(attempt);

    return NextResponse.json(
      {
        ...attempt,
        _id: result.insertedId.toString(),
        examId: attempt.examId.toString(),
        studentId: attempt.studentId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating exam attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create exam attempt' },
      { status: 500 }
    );
  }
}

