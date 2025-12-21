import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getDatabase } from '@/lib/mongodb';
// import { User } from '@/models/User';
// import { Document } from '@/models/Document';
import { ObjectId } from 'mongodb';
import { readFile } from 'fs/promises';
import { join } from 'path';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/documents/file?path=... - Serve PDF with authentication and permission check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user from database
    const db = await getDatabase();
    const user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find document by file path
    const document = await db
      .collection('documents')
      .findOne({ filePath });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'teacher') {
      // Teachers can view all documents
    } else if (user.role === 'student') {
      // Students can only view documents for their classes
      const studentClasses = await db.collection('classes').find({
        enrolledStudents: new ObjectId(userId),
      }).toArray();

      const studentClassIds = studentClasses.map((cls) => cls._id);

      const hasAccess = document.classes.some((docClassId: ObjectId | string) => {
        const docClassIdStr = typeof docClassId === 'string' ? docClassId : docClassId.toString();
        return studentClassIds.some((studentClassId) => {
          const studentClassIdStr = studentClassId.toString();
          return docClassIdStr === studentClassIdStr;
        });
      });

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Sanitize file path to prevent path traversal
    const sanitizedPath = filePath.replace(/\.\./g, '').replace(/[^a-zA-Z0-9._/-]/g, '');
    
    // Read PDF file
    const pdfPath = join(process.cwd(), 'public', sanitizedPath);
    
    try {
      const pdfBuffer = await readFile(pdfPath);
      
      // Return PDF with appropriate headers
      // Allow both inline viewing and download
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline', // Display in browser, but allow download
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (fileError) {
      console.error('Error reading PDF file:', fileError);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error serving document:', error);
    return NextResponse.json(
      { error: 'Failed to serve document' },
      { status: 500 }
    );
  }
}

