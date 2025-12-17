import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Document, CreateDocumentData } from '@/models/Document';
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
    return null;
  }
}

// GET /api/documents - Get documents (filtered by role)
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

      // Get documents that are accessible to student's classes
      const documents = await db
        .collection<Document>('documents')
        .find({
          classes: { $in: classIds },
        })
        .sort({ createdAt: -1 })
        .toArray();

      // Serialize ObjectIds
      const serialized = documents.map((doc) => ({
        ...doc,
        _id: doc._id?.toString(),
        classes: doc.classes?.map((id) => (typeof id === 'string' ? id : id.toString())),
        uploadedBy: doc.uploadedBy?.toString(),
      }));

      return NextResponse.json(serialized);
    } else {
      // For teachers: get all documents
      const auth = await verifyTeacher();
      if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const documents = await db
        .collection<Document>('documents')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      // Serialize ObjectIds
      const serialized = documents.map((doc) => ({
        ...doc,
        _id: doc._id?.toString(),
        classes: doc.classes?.map((id) => (typeof id === 'string' ? id : id.toString())),
        uploadedBy: doc.uploadedBy?.toString(),
      }));

      return NextResponse.json(serialized);
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create new document with file upload
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyTeacher();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const classesStr = formData.get('classes') as string;
    const classes = classesStr ? (JSON.parse(classesStr) as string[]) : [];
    const grade = formData.get('grade') ? parseInt(formData.get('grade') as string) : undefined;
    const note = formData.get('note') as string | null;
    const category = formData.get('category') as 'Bài tập' | 'Đề giữa kỳ' | 'Đề cuối kỳ';

    if (!file || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Create documents directory if it doesn't exist
    const documentsDir = join(process.cwd(), 'public', 'documents');
    if (!existsSync(documentsDir)) {
      await mkdir(documentsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = join(documentsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save document metadata to database
    const db = await getDatabase();
    const document: Document = {
      name,
      filePath: `/documents/${fileName}`,
      fileName: file.name,
      classes: classes.map((id) => new ObjectId(id)),
      grade,
      note: note || undefined,
      category,
      uploadedBy: new ObjectId(auth.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Document>('documents').insertOne(document);

    return NextResponse.json({
      ...document,
      _id: result.insertedId.toString(),
      classes: document.classes.map((id) => id.toString()),
      uploadedBy: document.uploadedBy?.toString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

