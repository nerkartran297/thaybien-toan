import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ExamAttempt, SubmitExamAttemptData } from '@/models/ExamAttempt';
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

// GET /api/exam-attempts/[id] - Get single exam attempt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyStudent();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDatabase();

    const attempt = await db
      .collection<ExamAttempt>('examAttempts')
      .findOne({
        _id: new ObjectId(id),
        studentId: new ObjectId(auth.userId), // Ensure student can only access their own attempts
      });

    if (!attempt) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    // Serialize ObjectIds
    return NextResponse.json({
      ...attempt,
      _id: attempt._id?.toString(),
      examId: attempt.examId?.toString(),
      studentId: attempt.studentId?.toString(),
    });
  } catch (error) {
    console.error('Error fetching exam attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam attempt' },
      { status: 500 }
    );
  }
}

// PUT /api/exam-attempts/[id] - Update exam attempt (save answers or submit)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyStudent();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data: SubmitExamAttemptData & { answers?: (string | null)[] } = await request.json();
    const db = await getDatabase();

    const existingAttempt = await db
      .collection<ExamAttempt>('examAttempts')
      .findOne({
        _id: new ObjectId(id),
        studentId: new ObjectId(auth.userId),
      });

    if (!existingAttempt) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    // If already submitted, don't allow updates
    if (existingAttempt.submittedAt) {
      return NextResponse.json(
        { error: 'Exam attempt already submitted' },
        { status: 400 }
      );
    }

    const updateData: Partial<ExamAttempt> = {
      updatedAt: new Date(),
    };

    // Update answers if provided
    if (data.answers) {
      updateData.answers = data.answers;
    }

    // If submitting (has submittedAt), calculate score
    if (data.submittedAt) {
      updateData.submittedAt = new Date(data.submittedAt);
      updateData.timeSpent = data.timeSpent;

      // Get exam to compare answers
      const exam = await db
        .collection<Exam>('exams')
        .findOne({ _id: existingAttempt.examId });

      if (exam && exam.answers) {
        // Calculate score
        let score = 0;
        const studentAnswers = data.answers || existingAttempt.answers;
        for (let i = 0; i < exam.answers.length; i++) {
          if (studentAnswers[i] === exam.answers[i]) {
            score++;
          }
        }
        updateData.score = score;
      }
    }

    const result = await db
      .collection<ExamAttempt>('examAttempts')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    const updated = await db
      .collection<ExamAttempt>('examAttempts')
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      ...updated,
      _id: updated?._id?.toString(),
      examId: updated?.examId?.toString(),
      studentId: updated?.studentId?.toString(),
      roomId: (updated as any)?.roomId?.toString(),
    });
  } catch (error) {
    console.error('Error updating exam attempt:', error);
    return NextResponse.json(
      { error: 'Failed to update exam attempt' },
      { status: 500 }
    );
  }
}

