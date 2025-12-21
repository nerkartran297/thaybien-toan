import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Attendance, CreateAttendanceData } from '@/models/Attendance';
import { ObjectId } from 'mongodb';

// GET /api/attendance - Get all attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const enrollmentId = searchParams.get('enrollmentId');
    const classId = searchParams.get('classId');
    const sessionDate = searchParams.get('sessionDate');

    const db = await getDatabase();
    const query: {
      studentId?: ObjectId;
      enrollmentId?: ObjectId;
      classId?: ObjectId;
      sessionDate?: {
        $gte: Date;
        $lte: Date;
      };
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
    if (sessionDate) {
      // Parse sessionDate as local date (GMT+7) to avoid timezone issues
      // If sessionDate is in format "yyyy-mm-dd", parse it as local midnight
      let sessionDateObj: Date;
      if (typeof sessionDate === 'string' && sessionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse as local date (GMT+7) - format: yyyy-mm-dd
        const [year, month, day] = sessionDate.split('-').map(Number);
        sessionDateObj = new Date(year, month - 1, day, 12, 0, 0, 0); // Use noon to avoid DST issues
        sessionDateObj.setHours(0, 0, 0, 0); // Set to midnight local time
      } else {
        sessionDateObj = new Date(sessionDate);
      }
      
      // Query for date range (start of day to end of day) to handle timezone issues
      const sessionDateStart = new Date(sessionDateObj);
      sessionDateStart.setHours(0, 0, 0, 0);
      const sessionDateEnd = new Date(sessionDateObj);
      sessionDateEnd.setHours(23, 59, 59, 999);
      
      query.sessionDate = {
        $gte: sessionDateStart,
        $lte: sessionDateEnd,
      };
    }

    const attendance = await db
      .collection('attendance')
      .find(query)
      .toArray();

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST /api/attendance - Create new attendance record
export async function POST(request: NextRequest) {
  try {
    const data: CreateAttendanceData = await request.json();

    // Validate required fields
    if (
      !data.studentId ||
      !data.enrollmentId ||
      !data.sessionDate ||
      !data.status ||
      !data.markedBy
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Parse sessionDate as local date (GMT+7) to avoid timezone issues
    // If sessionDate is in format "yyyy-mm-dd", parse it as local midnight
    let sessionDate: Date;
    if (typeof data.sessionDate === 'string' && data.sessionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse as local date (GMT+7) - format: yyyy-mm-dd
      const [year, month, day] = data.sessionDate.split('-').map(Number);
      sessionDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Use noon to avoid DST issues
      sessionDate.setHours(0, 0, 0, 0); // Set to midnight local time
    } else {
      sessionDate = new Date(data.sessionDate);
    }

    // Check if attendance already exists for this session
    // Compare dates at start of day (midnight) to avoid timezone issues
    const sessionDateStart = new Date(sessionDate);
    sessionDateStart.setHours(0, 0, 0, 0);
    const sessionDateEnd = new Date(sessionDate);
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

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance already recorded for this session' },
        { status: 400 }
      );
    }

      const attendance: Attendance = {
        studentId: new ObjectId(typeof data.studentId === 'string' ? data.studentId : data.studentId.toString()),
        enrollmentId: new ObjectId(typeof data.enrollmentId === 'string' ? data.enrollmentId : data.enrollmentId.toString()),
        classId: data.classId ? new ObjectId(typeof data.classId === 'string' ? data.classId : data.classId.toString()) : undefined,
      sessionDate: sessionDate,
      status: data.status,
      notes: data.notes,
      markedBy: new ObjectId(typeof data.markedBy === 'string' ? data.markedBy : data.markedBy.toString()),
      markedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection('attendance')
      .insertOne(attendance);

    // Update enrollment completed sessions if present
    if (data.status === 'present' || data.status === 'makeup') {
      await db.collection('enrollments').updateOne(
        { _id: new ObjectId(typeof data.enrollmentId === 'string' ? data.enrollmentId : data.enrollmentId.toString()) },
        {
          $inc: { completedSessions: 1, remainingSessions: -1 },
        }
      );
    }

    return NextResponse.json(
      { ...attendance, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      { error: 'Failed to create attendance' },
      { status: 500 }
    );
  }
}


