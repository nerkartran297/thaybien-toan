import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
// import { Course } from '@/models/Course';

// GET /api/courses - Get all courses
export async function GET(request: NextRequest) {
  // Log request URL (required parameter but not used in logic)
  console.log(`Request URL: ${request.url?.substring(0, 50)}...`);
  try {
    const db = await getDatabase();
    const courses = await db
      .collection('courses')
      .find({})
      .toArray();

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

