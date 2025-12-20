import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// POST /api/quiz-images/upload - Upload quiz question image
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
        { error: 'Only teachers can upload images' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only image files are allowed (JPEG, PNG, GIF, WebP)' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create quiz-images directory if it doesn't exist
    const imagesDir = join(process.cwd(), 'public', 'quiz-images');
    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileExtension = sanitizedFileName.split('.').pop() || 'jpg';
    const fileName = `quiz_${timestamp}_${randomStr}.${fileExtension}`;
    const filePath = join(imagesDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL path
    const publicPath = `/quiz-images/${fileName}`;

    return NextResponse.json({
      imageUrl: publicPath,
      fileName: file.name,
      fileSize: file.size,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

