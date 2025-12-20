import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Attendance, UpdateAttendanceData } from '@/models/Attendance';
import { ObjectId } from 'mongodb';

// GET /api/attendance/[id] - Get attendance by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const attendance = await db
      .collection<Attendance>('attendance')
      .findOne({ _id: new ObjectId(id) });

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// PUT /api/attendance/[id] - Update attendance
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data: UpdateAttendanceData = await request.json();
    const db = await getDatabase();

    // Check if attendance exists
    const existingAttendance = await db
      .collection<Attendance>('attendance')
      .findOne({ _id: new ObjectId(id) });

    if (!existingAttendance) {
      return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });
    }

    const updateData: UpdateAttendanceData = {
      ...data,
      updatedAt: new Date(),
    };

    const result = await db
      .collection<Attendance>('attendance')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });
    }

    // Fetch updated attendance
    const updatedAttendance = await db
      .collection<Attendance>('attendance')
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
}

// DELETE /api/attendance/[id] - Delete attendance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    // Check if attendance exists
    const existingAttendance = await db
      .collection<Attendance>('attendance')
      .findOne({ _id: new ObjectId(id) });

    if (!existingAttendance) {
      return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });
    }

    // Delete attendance
    const result = await db
      .collection<Attendance>('attendance')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Attendance deleted' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}

