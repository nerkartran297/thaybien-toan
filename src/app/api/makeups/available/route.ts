import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { StudentEnrollment } from '@/models/StudentEnrollment';
import { Class } from '@/models/Class';
import { ObjectId } from 'mongodb';

// GET /api/makeups/available - Get available classes for makeup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'enrollmentId is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get enrollment to find courseId
    const enrollment = await db
      .collection<StudentEnrollment>('enrollments')
      .findOne({ _id: new ObjectId(enrollmentId) });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Get all active classes for the same course that have available slots
    const now = new Date();
    const availableClasses = await db
      .collection<Class>('classes')
      .find({
        courseId: enrollment.courseId,
        isActive: true,
        $expr: { $lt: [{ $size: '$enrolledStudents' }, '$maxStudents'] },
      })
      .toArray();

    // Filter classes that are in the future (at least 1 day from now)
    const futureClasses = availableClasses.filter((cls) => {
      const classDate = new Date(cls.startTime);
      const daysUntilClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilClass >= 1; // At least 1 day in the future
    });

    // Sort by start time
    futureClasses.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return NextResponse.json(futureClasses);
  } catch (error) {
    console.error('Error fetching available makeup classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available makeup classes' },
      { status: 500 }
    );
  }
}

