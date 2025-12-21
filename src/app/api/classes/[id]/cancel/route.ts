import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Class } from '@/models/Class';
import { StudentEnrollment } from '@/models/StudentEnrollment';
import { AbsenceRequest } from '@/models/AbsenceRequest';
import { MakeupRequest } from '@/models/MakeupRequest';
import { Attendance } from '@/models/Attendance';
import { ObjectId } from 'mongodb';

// POST /api/classes/[id]/cancel - Cancel a class on a specific date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { date } = await request.json();
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Check if class exists
    const existingClass = await db
      .collection('classes')
      .findOne({ _id: new ObjectId(id) }) as Class | null;

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Normalize the date to start of day for comparison
    const cancelDate = new Date(date);
    cancelDate.setHours(0, 0, 0, 0);

    // Get existing cancelled dates or initialize empty array
    const cancelledDates = existingClass.cancelledDates || [];
    
    // Check if this date is already cancelled
    const isAlreadyCancelled = cancelledDates.some((d) => {
      const existingDate = new Date(d);
      existingDate.setHours(0, 0, 0, 0);
      return existingDate.getTime() === cancelDate.getTime();
    });

    if (isAlreadyCancelled) {
      return NextResponse.json(
        { error: 'This date is already cancelled' },
        { status: 400 }
      );
    }

    // Add the cancelled date
    cancelledDates.push(cancelDate);

    // Update the class
    const result = await db
      .collection('classes')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            cancelledDates,
            updatedAt: new Date(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // For all enrolled students:
    // 1. Create absence requests (vắng có phép)
    // 2. Create makeup requests (để học sinh có thể chọn học bù)
    // 3. Delete/refund makeup requests of students who were supposed to attend this class as makeup

    const sessionDate = new Date(cancelDate);
    // Set time to match class start time from first session
    if (existingClass.sessions && existingClass.sessions.length > 0) {
      const firstSession = existingClass.sessions[0];
      const [startHour, startMin] = firstSession.startTime.split(':').map(Number);
      sessionDate.setHours(startHour, startMin, 0, 0);
    } else {
      // Default to 8:00 AM if no sessions
      sessionDate.setHours(8, 0, 0, 0);
    }

    // Get all enrollments for students enrolled in this class
    const enrolledStudentIds = existingClass.enrolledStudents.map(id => 
      new ObjectId(typeof id === 'string' ? id : id.toString())
    );
    
    // Find enrollments for these students (each student should have one enrollment)
    const enrollments = await db
      .collection('enrollments')
      .find({
        studentId: { $in: enrolledStudentIds },
        status: { $in: ['active', 'pending'] },
      })
      .toArray() as StudentEnrollment[];

    const now = new Date();

    // Process each enrolled student
    for (const enrollment of enrollments) {
      const sessionDateStart = new Date(sessionDate);
      sessionDateStart.setHours(0, 0, 0, 0);
      const sessionDateEnd = new Date(sessionDate);
      sessionDateEnd.setHours(23, 59, 59, 999);

      // Check if student already has an absence request (đã xin vắng)
      const existingAbsence = await db
        .collection('absenceRequests')
        .findOne({
          studentId: enrollment.studentId,
          classId: existingClass._id,
          sessionDate: { $gte: sessionDateStart, $lt: sessionDateEnd },
        });

      // 1. Create attendance record with status "excused" (vắng có phép) for all students
      // Check if attendance already exists
      const existingAttendance = await db
        .collection('attendance')
        .findOne({
          studentId: enrollment.studentId,
          classId: existingClass._id,
          sessionDate: { $gte: sessionDateStart, $lt: sessionDateEnd },
        });

      if (!existingAttendance) {
        // Get teacher ID from request (if available)
        // For now, we'll try to get from cookies, but if not available, we'll skip markedBy
        // In production, this should be properly authenticated
        let teacherId: ObjectId | undefined;
        try {
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const token = cookieStore.get('auth-token')?.value;
          if (token) {
            const { jwtVerify } = await import('jose');
            const secret = new TextEncoder().encode(
              process.env.JWT_SECRET || 'your-secret-key-change-in-production'
            );
            const { payload } = await jwtVerify(token, secret);
            const userId = payload.userId as string;
            if (userId) {
              teacherId = new ObjectId(userId);
            }
          }
        } catch (error) {
          console.error('Error getting teacher ID:', error);
          // Continue without teacherId - attendance will still be created
        }
        
        const attendance: Attendance = {
          studentId: enrollment.studentId,
          enrollmentId: enrollment._id!,
          classId: existingClass._id,
          sessionDate: sessionDate,
          status: 'excused', // Vắng có phép
          notes: 'Lớp học bị hủy bởi giáo viên',
          markedBy: teacherId || new ObjectId(), // Use placeholder if teacher ID not available
          markedAt: now,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection('attendance').insertOne(attendance);
      }

      // 2. Create absence request for tracking (optional, but keep for history)
      // Note: Attendance record with status "excused" is already created above
      if (!existingAbsence) {
        const absenceRequest: AbsenceRequest = {
          studentId: enrollment.studentId,
          enrollmentId: enrollment._id!,
          classId: existingClass._id,
          sessionDate,
          reason: 'Lớp học bị hủy bởi giáo viên',
          requestedAt: now,
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection('absenceRequests').insertOne(absenceRequest);
      }

      // 3. Create makeup request ONLY for students who did NOT already request absence
      // Students who already requested absence should NOT get makeup session
      if (!existingAbsence) {
        // Create a pending makeup request - student will choose makeup class later
        const tempNewSessionDate = new Date(sessionDate);
        tempNewSessionDate.setDate(tempNewSessionDate.getDate() + 7); // 1 week later as placeholder
        
        const makeupRequest: MakeupRequest = {
          studentId: enrollment.studentId,
          enrollmentId: enrollment._id!,
          originalClassId: existingClass._id,
          originalSessionDate: sessionDate,
          newSessionDate: tempNewSessionDate, // Temporary, student will update when choosing makeup class
          reason: 'Lớp học bị hủy bởi giáo viên - Chờ học sinh chọn lớp học bù',
          requestedAt: now,
          status: 'pending', // Pending until student chooses makeup class
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Check if makeup request already exists
        const originalSessionDateStart = new Date(sessionDate);
        originalSessionDateStart.setHours(0, 0, 0, 0);
        const originalSessionDateEnd = new Date(sessionDate);
        originalSessionDateEnd.setHours(23, 59, 59, 999);
        
        const existingMakeup = await db
          .collection('makeupRequests')
          .findOne({
            studentId: enrollment.studentId,
            originalClassId: existingClass._id,
            originalSessionDate: { $gte: originalSessionDateStart, $lt: originalSessionDateEnd },
          });

        if (!existingMakeup) {
          await db.collection('makeupRequests').insertOne(makeupRequest);
        }
      }
    }

    // 3. Delete/refund makeup requests of students who were supposed to attend this class as makeup
    // Find all makeup requests for this class on this date
    const cancelDateStart = new Date(cancelDate);
    cancelDateStart.setHours(0, 0, 0, 0);
    const cancelDateEnd = new Date(cancelDate);
    cancelDateEnd.setHours(23, 59, 59, 999);
    
    const makeupRequestsToRefund = await db
      .collection('makeupRequests')
      .find({
        newClassId: existingClass._id,
        newSessionDate: { $gte: cancelDateStart, $lt: cancelDateEnd },
        status: 'approved',
      })
      .toArray();

    // Delete these makeup requests (refund)
    if (makeupRequestsToRefund.length > 0) {
      // Delete each makeup request individually
      for (const makeupRequest of makeupRequestsToRefund) {
        if (makeupRequest._id) {
          await db.collection('makeupRequests').deleteOne({ _id: makeupRequest._id });
        }
      }
    }

    // Fetch updated class
    const updatedClass = await db
      .collection('classes')
      .findOne({ _id: new ObjectId(id) }) as Class | null;

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error('Error cancelling class:', error);
    return NextResponse.json(
      { error: 'Failed to cancel class' },
      { status: 500 }
    );
  }
}

