import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { MakeupRequest, CreateMakeupRequestData } from '@/models/MakeupRequest';
// import { StudentEnrollment } from '@/models/StudentEnrollment';
// import { Class } from '@/models/Class';
import { ObjectId } from 'mongodb';

// GET /api/makeups - Get all makeup requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const enrollmentId = searchParams.get('enrollmentId');
    const status = searchParams.get('status');

    const db = await getDatabase();
    const query: {
      studentId?: ObjectId;
      enrollmentId?: ObjectId;
      status?: 'pending' | 'approved' | 'rejected';
    } = {};

    if (studentId) {
      query.studentId = new ObjectId(studentId);
    }
    if (enrollmentId) {
      query.enrollmentId = new ObjectId(enrollmentId);
    }
    if (status && (status === 'pending' || status === 'approved' || status === 'rejected')) {
      query.status = status;
    }

    const makeups = await db
      .collection('makeupRequests')
      .find(query)
      .toArray();

    return NextResponse.json(makeups);
  } catch (error) {
    console.error('Error fetching makeup requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch makeup requests' },
      { status: 500 }
    );
  }
}


// POST /api/makeups - Create new makeup request
export async function POST(request: NextRequest) {
  try {
    const data: CreateMakeupRequestData = await request.json();

    // Validate required fields
    if (
      !data.studentId ||
      !data.enrollmentId ||
      !data.originalSessionDate ||
      !data.newSessionDate ||
      !data.reason
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newSessionDate = new Date(data.newSessionDate);
    const now = new Date();

    // Check if request is at least 1 day before new session
    const daysUntilSession = (newSessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilSession < 1) {
      return NextResponse.json(
        { error: 'Makeup request must be made at least 1 day before the new session' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if new class has available slots
    if (data.newClassId) {
      const newClassIdObj = typeof data.newClassId === 'string' 
        ? new ObjectId(data.newClassId) 
        : data.newClassId;
      const newClass = await db
        .collection('classes')
        .findOne({ _id: newClassIdObj });

      if (!newClass) {
        return NextResponse.json({ error: 'New class not found' }, { status: 404 });
      }

      if (newClass.enrolledStudents.length >= newClass.maxStudents) {
        return NextResponse.json(
          { error: 'Class is full' },
          { status: 400 }
        );
      }
    }

    const studentIdObj = typeof data.studentId === 'string' 
      ? new ObjectId(data.studentId) 
      : data.studentId;
    const enrollmentIdObj = typeof data.enrollmentId === 'string' 
      ? new ObjectId(data.enrollmentId) 
      : data.enrollmentId;
    const originalClassIdObj = data.originalClassId 
      ? (typeof data.originalClassId === 'string' ? new ObjectId(data.originalClassId) : data.originalClassId)
      : undefined;
    const newClassIdObj = data.newClassId 
      ? (typeof data.newClassId === 'string' ? new ObjectId(data.newClassId) : data.newClassId)
      : undefined;

    const makeupRequest: MakeupRequest = {
      studentId: studentIdObj,
      enrollmentId: enrollmentIdObj,
      originalClassId: originalClassIdObj,
      originalSessionDate: new Date(data.originalSessionDate),
      newClassId: newClassIdObj,
      newSessionDate,
      reason: data.reason,
      requestedAt: now,
      status: 'approved', // Auto-approved
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection('makeupRequests')
      .insertOne(makeupRequest);

    // NOTE: Do NOT add student to enrolledStudents for makeup classes
    // Makeup is a one-time attendance, not permanent enrollment
    // The makeup request itself is enough to track the makeup session

    return NextResponse.json(
      { ...makeupRequest, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating makeup request:', error);
    return NextResponse.json(
      { error: 'Failed to create makeup request' },
      { status: 500 }
    );
  }
}

