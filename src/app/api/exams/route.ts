import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Exam } from '@/models/Exam';
// import { CreateExamData } from '@/models/Exam';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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
    console.log(`Auth error: ${String(error).substring(0, 20)}...`);
    return null;
  }
}

// GET /api/exams - Get exams (filtered by role)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    const db = await getDatabase();

    if (role === 'student') {
      // For students: filter by their classes
      const auth = await verifyStudent();
      if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get student's classes
      const classes = await db.collection('classes').find({
        enrolledStudents: new ObjectId(auth.userId),
      }).toArray();

      const classIds = classes.map((cls) => cls._id);

      // Get exams that are accessible to student's classes
      const exams = await db
        .collection('exams')
        .find({
          classes: { $in: classIds },
        })
        .sort({ createdAt: -1 })
        .toArray();

      // Serialize ObjectIds
      const serialized = exams.map((exam) => ({
        ...exam,
        _id: exam._id?.toString(),
        classes: exam.classes?.map((id: ObjectId | string) => (typeof id === 'string' ? id : id.toString())),
        createdBy: exam.createdBy?.toString(),
      }));

      return NextResponse.json(serialized);
    } else {
      // For teachers: get all exams
      const auth = await verifyTeacher();
      if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const exams = await db
        .collection('exams')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      // Serialize ObjectIds
      const serialized = exams.map((exam) => ({
        ...exam,
        _id: exam._id?.toString(),
        classes: exam.classes?.map((id: ObjectId | string) => (typeof id === 'string' ? id : id.toString())),
        createdBy: exam.createdBy?.toString(),
      }));

      return NextResponse.json(serialized);
    }
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}

// POST /api/exams - Create new exam with file upload
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyTeacher();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const classesStr = formData.get('classes') as string;
    const classes = classesStr ? (JSON.parse(classesStr) as string[]) : [];
    const grade = formData.get('grade') ? parseInt(formData.get('grade') as string) : undefined;
    const category = formData.get('category') as 'Đề giữa kỳ' | 'Đề cuối kỳ' | 'Đề luyện tập';
    const timeLimit = formData.get('timeLimit') ? parseInt(formData.get('timeLimit') as string) : undefined;
    const note = formData.get('note') as string | null;

    if (!file || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!timeLimit || timeLimit <= 0) {
      return NextResponse.json(
        { error: 'Time limit is required and must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Create exams directory if it doesn't exist
    const examsDir = join(process.cwd(), 'public', 'exams');
    if (!existsSync(examsDir)) {
      await mkdir(examsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = join(examsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save exam metadata to database
    const db = await getDatabase();
    const exam: Exam = {
      name,
      description: description || undefined,
      filePath: `/exams/${fileName}`,
      fileName: file.name,
      classes: classes.map((id) => new ObjectId(id)),
      grade,
      category,
      timeLimit,
      note: note || undefined,
      createdBy: new ObjectId(auth.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('exams').insertOne(exam);

    return NextResponse.json({
      ...exam,
      _id: result.insertedId.toString(),
      classes: exam.classes.map((id) => id.toString()),
      createdBy: exam.createdBy?.toString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    );
  }
}

