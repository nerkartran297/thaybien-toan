import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AbsenceRequest, CreateAbsenceRequestData } from '@/models/AbsenceRequest';
import { Attendance } from '@/models/Attendance';
import { ObjectId } from 'mongodb';

// GET /api/absences - Get all absence requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const enrollmentId = searchParams.get('enrollmentId');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');

    const db = await getDatabase();
    const query: {
      studentId?: ObjectId;
      enrollmentId?: ObjectId;
      classId?: ObjectId;
      status?: 'pending' | 'approved' | 'rejected';
    } = {};

    if (studentId) {
      query.studentId = new ObjectId(studentId);
    }
    if (enrollmentId) {
      query.enrollmentId = new ObjectId(enrollmentId);
    }
    if (classId) {
      query.classId = new ObjectId(classId);
    }
    if (status && (status === 'pending' || status === 'approved' || status === 'rejected')) {
      query.status = status;
    }

    const absences = await db
      .collection('absenceRequests')
      .find(query)
      .toArray() as AbsenceRequest[];

    return NextResponse.json(absences);
  } catch (error) {
    console.error('Error fetching absence requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch absence requests' },
      { status: 500 }
    );
  }
}

// POST /api/absences - Create new absence request
export async function POST(request: NextRequest) {
  try {
    const data: CreateAbsenceRequestData = await request.json();

    // Validate required fields
    if (!data.studentId || !data.enrollmentId || !data.sessionDate || !data.reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sessionDate = new Date(data.sessionDate);
    const now = new Date();

    // Check if request is at least 6 hours before session
    // Skip this validation if markedByTeacher is true (teacher manually marking attendance)
    const markedByTeacher = (data as CreateAbsenceRequestData & { markedByTeacher?: boolean }).markedByTeacher === true;
    if (!markedByTeacher) {
      const hoursUntilSession = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilSession < 6) {
        return NextResponse.json(
          { error: 'Absence request must be made at least 6 hours before the session' },
          { status: 400 }
        );
      }
    }

    const db = await getDatabase();

    const absenceRequest: AbsenceRequest = {
      studentId: new ObjectId(typeof data.studentId === 'string' ? data.studentId : data.studentId.toString()),
      enrollmentId: new ObjectId(typeof data.enrollmentId === 'string' ? data.enrollmentId : data.enrollmentId.toString()),
      classId: data.classId ? new ObjectId(typeof data.classId === 'string' ? data.classId : data.classId.toString()) : undefined,
      sessionDate,
      reason: data.reason,
      requestedAt: now,
      status: 'approved', // Auto-approved
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection('absenceRequests')
      .insertOne(absenceRequest);

    // Automatically create attendance record with status "excused"
    // Parse sessionDate as local date (GMT+7) to avoid timezone issues
    let sessionDateObj: Date;
    if (typeof data.sessionDate === 'string' && data.sessionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse as local date (GMT+7) - format: yyyy-mm-dd
      const [year, month, day] = data.sessionDate.split('-').map(Number);
      sessionDateObj = new Date(year, month - 1, day, 12, 0, 0, 0); // Use noon to avoid DST issues
      sessionDateObj.setHours(0, 0, 0, 0); // Set to midnight local time
    } else {
      sessionDateObj = new Date(data.sessionDate);
      sessionDateObj.setHours(0, 0, 0, 0);
    }

    // Check if attendance record already exists
    const sessionDateStart = new Date(sessionDateObj);
    sessionDateStart.setHours(0, 0, 0, 0);
    const sessionDateEnd = new Date(sessionDateObj);
    sessionDateEnd.setHours(23, 59, 59, 999);

    const existingAttendance = await db
      .collection('attendance')
      .findOne({
        studentId: new ObjectId(typeof data.studentId === 'string' ? data.studentId : data.studentId.toString()),
        sessionDate: {
          $gte: sessionDateStart,
          $lte: sessionDateEnd,
        },
      });

    // Only create attendance record if it doesn't exist
    if (!existingAttendance) {
      const attendance: Attendance = {
        studentId: new ObjectId(typeof data.studentId === 'string' ? data.studentId : data.studentId.toString()),
        enrollmentId: new ObjectId(typeof data.enrollmentId === 'string' ? data.enrollmentId : data.enrollmentId.toString()),
        classId: data.classId ? new ObjectId(typeof data.classId === 'string' ? data.classId : data.classId.toString()) : undefined,
        sessionDate: sessionDateObj,
        status: 'excused',
        markedBy: new ObjectId(typeof data.studentId === 'string' ? data.studentId : data.studentId.toString()), // Student requested absence, so marked by themselves
        markedAt: now,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('attendance').insertOne(attendance);
    }

    return NextResponse.json(
      { ...absenceRequest, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating absence request:', error);
    return NextResponse.json(
      { error: 'Failed to create absence request' },
      { status: 500 }
    );
  }
}

