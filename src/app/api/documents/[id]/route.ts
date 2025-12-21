import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Document, UpdateDocumentData } from '@/models/Document';
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

// GET /api/documents/[id] - Get single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    
    const document = await db
      .collection('documents')
      .findOne({ _id: new ObjectId(id) }) as Document | null;

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Serialize ObjectIds
    return NextResponse.json({
      ...document,
      _id: document._id?.toString(),
      classes: document.classes?.map((id) => (typeof id === 'string' ? id : id.toString())),
      uploadedBy: document.uploadedBy?.toString(),
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Update document
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
    const data: UpdateDocumentData = await request.json();
    const db = await getDatabase();

    const existingDoc = await db
      .collection('documents')
      .findOne({ _id: new ObjectId(id) }) as Document | null;

    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Convert classes from string[] to ObjectId[] if present
    const { classes, ...restData } = data;
    const updateData: Partial<Document> = {
      ...restData,
      updatedAt: new Date(),
    };

    if (classes) {
      updateData.classes = classes.map((id) => new ObjectId(id));
    }

    const result = await db
      .collection('documents')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updated = await db
      .collection('documents')
      .findOne({ _id: new ObjectId(id) }) as Document | null;

    return NextResponse.json({
      ...updated,
      _id: updated?._id?.toString(),
      classes: updated?.classes?.map((id) => (typeof id === 'string' ? id : id.toString())),
      uploadedBy: updated?.uploadedBy?.toString(),
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete document
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

    const document = await db
      .collection('documents')
      .findOne({ _id: new ObjectId(id) }) as Document | null;

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', document.filePath);
      await unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    const result = await db
      .collection('documents')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

