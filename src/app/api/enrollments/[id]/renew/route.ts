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

// POST /api/enrollments/[id]/renew - Renew enrollment (create new enrollment after current one ends)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = await getDatabase();
    const existingEnrollment = await db
      .collection<StudentEnrollment>('enrollments')
      .findOne({ _id: new ObjectId(id) });

    if (!existingEnrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Check if student already has an active enrollment (shouldn't happen, but check anyway)
    const activeEnrollment = await db
      .collection<StudentEnrollment>('enrollments')
      .findOne({
        studentId: existingEnrollment.studentId,
        status: { $in: ['pending', 'active'] },
        _id: { $ne: new ObjectId(id) },
      });

    if (activeEnrollment) {
      return NextResponse.json(
        { error: 'Student already has an active enrollment' },
        { status: 400 }
      );
    }

    // Mark current enrollment as completed
    await db
      .collection<StudentEnrollment>('enrollments')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'completed',
            updatedAt: new Date(),
          },
        }
      );

    // Create new enrollment starting the day after current enrollment ends
    const newStartDate = new Date(existingEnrollment.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    newStartDate.setHours(0, 0, 0, 0);

    // Keep same payment mode and custom weeks from existing enrollment
    const paymentMode = existingEnrollment.paymentMode || 'default';
    const customWeeks = existingEnrollment.customWeeks;
    const totalSessions = calculateTotalSessions(existingEnrollment.frequency, paymentMode, customWeeks);
    const newEndDate = calculateEndDate(newStartDate, existingEnrollment.frequency, paymentMode, customWeeks);

    const newEnrollment: StudentEnrollment = {
      studentId: existingEnrollment.studentId,
      courseId: existingEnrollment.courseId,
      frequency: existingEnrollment.frequency,
      startDate: newStartDate,
      endDate: newEndDate,
      status: 'pending', // Will be activated when student starts
      schedule: existingEnrollment.schedule, // Keep same schedule
      cycle: existingEnrollment.cycle, // Keep same cycle
      paymentMode: paymentMode, // Keep same payment mode
      customWeeks: customWeeks, // Keep same custom weeks
      totalSessions: totalSessions, // Calculate based on payment mode
      completedSessions: 0,
      remainingSessions: totalSessions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection<StudentEnrollment>('enrollments')
      .insertOne(newEnrollment);

    return NextResponse.json(
      { ...newEnrollment, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error renewing enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to renew enrollment' },
      { status: 500 }
    );
  }
}

