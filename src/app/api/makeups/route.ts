import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { MakeupRequest, CreateMakeupRequestData } from '@/models/MakeupRequest';
import { StudentEnrollment } from '@/models/StudentEnrollment';
import { Class } from '@/models/Class';
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
      .collection<MakeupRequest>('makeupRequests')
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
      const newClass = await db
        .collection<Class>('classes')
        .findOne({ _id: new ObjectId(data.newClassId) });

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

    const makeupRequest: MakeupRequest = {
      studentId: new ObjectId(data.studentId),
      enrollmentId: new ObjectId(data.enrollmentId),
      originalClassId: data.originalClassId ? new ObjectId(data.originalClassId) : undefined,
      originalSessionDate: new Date(data.originalSessionDate),
      newClassId: data.newClassId ? new ObjectId(data.newClassId) : undefined,
      newSessionDate,
      reason: data.reason,
      requestedAt: now,
      status: 'approved', // Auto-approved
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection<MakeupRequest>('makeupRequests')
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

