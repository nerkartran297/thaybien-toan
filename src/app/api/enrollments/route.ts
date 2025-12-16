import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { StudentEnrollment, CreateEnrollmentData } from '@/models/StudentEnrollment';
import { ObjectId } from 'mongodb';

// Helper function to calculate end date
function calculateEndDate(
  startDate: Date,
  frequency: 1 | 2,
  paymentMode?: 'default' | 'custom',
  customWeeks?: number
): Date {
  let weeks: number;
  if (paymentMode === 'custom' && customWeeks) {
    weeks = customWeeks;
  } else {
    // Default mode: 9 weeks for frequency 2, 18 weeks for frequency 1
    weeks = frequency === 1 ? 18 : 9;
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + weeks * 7);
  return endDate;
}

// Helper function to calculate total sessions
function calculateTotalSessions(
  frequency: 1 | 2,
  paymentMode?: 'default' | 'custom',
  customWeeks?: number
): number {
  if (paymentMode === 'custom' && customWeeks) {
    // Custom mode: số tuần * tần suất học = số buổi
    return customWeeks * frequency;
  } else {
    // Default mode: 12 buổi
    return 12;
  }
}

// GET /api/enrollments - Get all enrollments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');

    const db = await getDatabase();
    const query: {
      studentId?: ObjectId;
      courseId?: ObjectId;
      status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'deferred';
    } = {};

    if (studentId) {
      query.studentId = new ObjectId(studentId);
    }
    if (courseId) {
      query.courseId = new ObjectId(courseId);
    }
    if (status && (status === 'pending' || status === 'active' || status === 'completed' || status === 'cancelled' || status === 'deferred')) {
      query.status = status;
    }

    const enrollments = await db
      .collection<StudentEnrollment>('enrollments')
      .find(query)
      .toArray();

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// POST /api/enrollments - Create new enrollment
export async function POST(request: NextRequest) {
  try {
    const data: CreateEnrollmentData = await request.json();

    // Validate required fields
    if (!data.studentId || !data.courseId || !data.frequency || !data.startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Schedule is optional, default to empty sessions if not provided
    const schedule = data.schedule || { sessions: [] };

    const db = await getDatabase();

    // Check if student already has an active enrollment
    const existingEnrollment = await db
      .collection<StudentEnrollment>('enrollments')
      .findOne({
        studentId: new ObjectId(data.studentId),
        status: { $in: ['pending', 'active'] },
      });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Student already has an active enrollment' },
        { status: 400 }
      );
    }

    const startDate = new Date(data.startDate);
    const paymentMode = data.paymentMode || 'default';
    const customWeeks = data.customWeeks;
    const totalSessions = calculateTotalSessions(data.frequency, paymentMode, customWeeks);
    const endDate = calculateEndDate(startDate, data.frequency, paymentMode, customWeeks);

    const enrollment: StudentEnrollment = {
      studentId: new ObjectId(data.studentId),
      courseId: new ObjectId(data.courseId),
      frequency: data.frequency,
      startDate,
      endDate,
      status: 'pending',
      schedule: schedule,
      cycle: data.cycle, // Chu kỳ đếm số buổi (ví dụ: 4, 6)
      paymentMode: paymentMode,
      customWeeks: customWeeks,
      totalSessions: totalSessions,
      completedSessions: 0,
      remainingSessions: totalSessions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection<StudentEnrollment>('enrollments')
      .insertOne(enrollment);

    return NextResponse.json(
      { ...enrollment, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    );
  }
}

