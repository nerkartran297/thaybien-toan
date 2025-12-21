import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Exam, UpdateExamData } from '@/models/Exam';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { unlink } from 'fs/promises';
import { join } from 'path';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

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
    console.log(`Auth error: ${String(error).substring(0, 20)}...`);
    return null;
  }
}

// GET /api/exams/[id] - Get single exam
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    
    const exam = await db
      .collection('exams')
      .findOne({ _id: new ObjectId(id) }) as Exam | null;

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Serialize ObjectIds
    return NextResponse.json({
      ...exam,
      _id: exam._id?.toString(),
      classes: exam.classes?.map((id) => (typeof id === 'string' ? id : id.toString())),
      createdBy: exam.createdBy?.toString(),
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

// PUT /api/exams/[id] - Update exam
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyTeacher();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data: UpdateExamData = await request.json();
    const db = await getDatabase();

    const existingExam = await db
      .collection('exams')
      .findOne({ _id: new ObjectId(id) }) as Exam | null;

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Convert classes from string[] to ObjectId[] if present
    const { classes, ...restData } = data;
    const updateData: Partial<Exam> = {
      ...restData,
      updatedAt: new Date(),
    };

    if (classes) {
      updateData.classes = classes.map((id) => new ObjectId(id));
    }

    const result = await db
      .collection('exams')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const updated = await db
      .collection('exams')
      .findOne({ _id: new ObjectId(id) }) as Exam | null;

    return NextResponse.json({
      ...updated,
      _id: updated?._id?.toString(),
      classes: updated?.classes?.map((id) => (typeof id === 'string' ? id : id.toString())),
      createdBy: updated?.createdBy?.toString(),
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[id] - Delete exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyTeacher();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDatabase();

    const exam = await db
      .collection('exams')
      .findOne({ _id: new ObjectId(id) }) as Exam | null;

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', exam.filePath);
      await unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    const result = await db
      .collection('exams')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}

