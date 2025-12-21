import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { StudentEnrollment, UpdateEnrollmentData, ScheduleSession } from '@/models/StudentEnrollment';
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

// GET /api/enrollments/[id] - Get enrollment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const enrollment = await db
      .collection('enrollments')
      .findOne({ _id: new ObjectId(id) }) as StudentEnrollment | null;

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollment' },
      { status: 500 }
    );
  }
}

// PUT /api/enrollments/[id] - Update enrollment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data: UpdateEnrollmentData = await request.json();
    const db = await getDatabase();

    // Check if enrollment exists
    const existingEnrollment = await db
      .collection('enrollments')
      .findOne({ _id: new ObjectId(id) }) as StudentEnrollment | null;

    if (!existingEnrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Convert startDate to Date if provided
    const { startDate: startDateInput, ...restData } = data;
    const updateData: Partial<StudentEnrollment> & { updatedAt: Date } = {
      ...restData,
      updatedAt: new Date(),
    };

    // Recalculate end date and total sessions if relevant fields changed
    const frequency = data.frequency || existingEnrollment.frequency;
    const startDate = startDateInput ? new Date(startDateInput) : existingEnrollment.startDate;
    
    // Add startDate to updateData if it was provided
    if (startDateInput) {
      updateData.startDate = startDate;
    }
    const paymentMode = data.paymentMode !== undefined ? data.paymentMode : existingEnrollment.paymentMode || 'default';
    const customWeeks = data.customWeeks !== undefined ? data.customWeeks : existingEnrollment.customWeeks;

    if (data.frequency || data.startDate || data.paymentMode !== undefined || data.customWeeks !== undefined) {
      updateData.endDate = calculateEndDate(startDate, frequency, paymentMode, customWeeks);
    }

    // Recalculate total sessions if payment mode or custom weeks changed
    if (data.paymentMode !== undefined || data.customWeeks !== undefined || data.frequency) {
      updateData.totalSessions = calculateTotalSessions(frequency, paymentMode, customWeeks);
      // If totalSessions changed, adjust remainingSessions to maintain consistency
      if (updateData.totalSessions !== undefined && existingEnrollment.totalSessions !== undefined) {
        // const oldTotal = existingEnrollment.totalSessions;
        const newTotal = updateData.totalSessions;
        const completed = existingEnrollment.completedSessions;
        // Adjust remainingSessions based on new total
        updateData.remainingSessions = Math.max(0, newTotal - completed);
      }
    }

    // Convert ObjectIds if needed
    if (updateData.schedule?.sessions) {
      updateData.schedule.sessions = updateData.schedule.sessions.map((session: ScheduleSession & { classId?: string | ObjectId }) => ({
        ...session,
        classId: session.classId ? (typeof session.classId === 'string' ? new ObjectId(session.classId) : session.classId) : undefined,
      }));
    }

    const result = await db
      .collection('enrollments')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Fetch updated enrollment
    const updatedEnrollment = await db
      .collection('enrollments')
      .findOne({ _id: new ObjectId(id) }) as StudentEnrollment | null;

    return NextResponse.json(updatedEnrollment);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    );
  }
}

// PUT /api/enrollments/[id]/defer - Request deferral
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { deferralWeeks } = await request.json();

    if (!deferralWeeks || deferralWeeks < 1 || deferralWeeks > 4) {
      return NextResponse.json(
        { error: 'Deferral weeks must be between 1 and 4' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const enrollment = await db
      .collection('enrollments')
      .findOne({ _id: new ObjectId(id) }) as StudentEnrollment | null;

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Check if student has already deferred (only allowed once per enrollment)
    if (enrollment.deferralWeeks && enrollment.deferralWeeks > 0) {
      return NextResponse.json(
        { error: 'Student has already deferred this enrollment. Only one deferral is allowed per enrollment.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const deferralStartDate = new Date(now);
    deferralStartDate.setHours(0, 0, 0, 0);
    const deferralEndDate = new Date(deferralStartDate);
    deferralEndDate.setDate(deferralEndDate.getDate() + deferralWeeks * 7);

    // Extend end date by deferral weeks
    const newEndDate = new Date(enrollment.endDate);
    newEndDate.setDate(newEndDate.getDate() + deferralWeeks * 7);

    // Update enrollment
    const result = await db
      .collection('enrollments')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            deferralWeeks,
            endDate: newEndDate,
            status: 'deferred',
            updatedAt: new Date(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Create absence requests for all scheduled classes during deferral period
    // Get all scheduled sessions from enrollment
    const scheduledSessions = enrollment.schedule?.sessions || [];

    // Generate all class dates during deferral period
    // For each week in deferral period
    for (let week = 0; week < deferralWeeks; week++) {
      const currentWeekStart = new Date(deferralStartDate);
      currentWeekStart.setDate(currentWeekStart.getDate() + week * 7);
      
      // For each scheduled session, find the date in this week
      for (const session of scheduledSessions) {
        if (!session.classId) continue;
        
        // Calculate the date of this session in the current week
        // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const currentWeekDay = currentWeekStart.getDay(); // 0-6
        let daysToAdd = session.dayOfWeek - currentWeekDay;
        if (daysToAdd < 0) {
          daysToAdd += 7; // If dayOfWeek is earlier in the week, add 7 days
        }
        
        const sessionDate = new Date(currentWeekStart);
        sessionDate.setDate(sessionDate.getDate() + daysToAdd);
        
        // Only create absence for dates within deferral period
        if (sessionDate >= deferralStartDate && sessionDate < deferralEndDate) {
          // Get class to get start time
          const classData = await db
            .collection('classes')
            .findOne({ _id: session.classId });
          
          const finalSessionDate = new Date(sessionDate);
          if (classData && classData.startTime) {
            // Set session date to match class start time
            const classStartTime = new Date(classData.startTime);
            finalSessionDate.setHours(
              classStartTime.getHours(),
              classStartTime.getMinutes(),
              0,
              0
            );
          } else {
            finalSessionDate.setHours(0, 0, 0, 0);
          }

          // Check if absence request already exists for this date
          const sessionDateStart = new Date(finalSessionDate);
          sessionDateStart.setHours(0, 0, 0, 0);
          const sessionDateEnd = new Date(finalSessionDate);
          sessionDateEnd.setHours(23, 59, 59, 999);
          
          const existingAbsence = await db
            .collection('absenceRequests')
            .findOne({
              studentId: enrollment.studentId,
              classId: session.classId,
              sessionDate: { $gte: sessionDateStart, $lte: sessionDateEnd },
            });

          if (!existingAbsence) {
            const absenceRequest = {
              studentId: enrollment.studentId,
              enrollmentId: enrollment._id,
              classId: session.classId,
              sessionDate: finalSessionDate,
              reason: `Bảo lưu ${deferralWeeks} tuần`,
              requestedAt: now,
              status: 'approved',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            await db.collection('absenceRequests').insertOne(absenceRequest);
          }
        }
      }
    }

    const updatedEnrollment = await db
      .collection('enrollments')
      .findOne({ _id: new ObjectId(id) }) as StudentEnrollment | null;

    return NextResponse.json(updatedEnrollment);
  } catch (error) {
    console.error('Error deferring enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to defer enrollment' },
      { status: 500 }
    );
  }
}

