import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Class } from '@/models/Class';
// import { UpdateClassData } from '@/models/Class';
import { ObjectId } from 'mongodb';

// GET /api/classes/[id] - Get class by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const classData = await db
      .collection('classes')
      .findOne({ _id: new ObjectId(id) }) as Class | null;

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id] - Update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { updateSeries, ...data } = body;
    console.log(`Update series flag: ${updateSeries ? 'true' : 'false'}`);
    const db = await getDatabase();

    // Check if class exists
    const existingClass = await db
      .collection('classes')
      .findOne({ _id: new ObjectId(id) }) as Class | null;

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Validate required fields
    if (data.name && !data.name.trim()) {
      return NextResponse.json(
        { error: 'Class name is required' },
        { status: 400 }
      );
    }

    if (data.grade !== undefined && (data.grade < 6 || data.grade > 12)) {
      return NextResponse.json(
        { error: 'Grade must be between 6 and 12' },
        { status: 400 }
      );
    }

    // Validate sessions if provided
    if (data.sessions) {
      if (!Array.isArray(data.sessions) || data.sessions.length === 0) {
        return NextResponse.json(
          { error: 'At least one session is required' },
          { status: 400 }
        );
      }

      // Validate each session
      for (const session of data.sessions) {
        if (
          typeof session.dayOfWeek !== 'number' ||
          session.dayOfWeek < 0 ||
          session.dayOfWeek > 6
        ) {
          return NextResponse.json(
            { error: 'Invalid dayOfWeek in session' },
            { status: 400 }
          );
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(session.startTime) || !timeRegex.test(session.endTime)) {
          return NextResponse.json(
            { error: 'Invalid time format in session' },
            { status: 400 }
          );
        }

        // Validate end time is after start time
        const [startHour, startMin] = session.startTime.split(':').map(Number);
        const [endHour, endMin] = session.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (endMinutes <= startMinutes) {
          return NextResponse.json(
            { error: 'End time must be after start time' },
            { status: 400 }
          );
        }
      }

      // Check for time conflicts within the same class (if updating sessions)
      if (data.sessions.length > 1) {
        for (let i = 0; i < data.sessions.length; i++) {
          for (let j = i + 1; j < data.sessions.length; j++) {
            const s1 = data.sessions[i];
            const s2 = data.sessions[j];

            if (s1.dayOfWeek === s2.dayOfWeek) {
              const [s1StartHour, s1StartMin] = s1.startTime.split(':').map(Number);
              const [s1EndHour, s1EndMin] = s1.endTime.split(':').map(Number);
              const [s2StartHour, s2StartMin] = s2.startTime.split(':').map(Number);
              const [s2EndHour, s2EndMin] = s2.endTime.split(':').map(Number);

              const s1Start = s1StartHour * 60 + s1StartMin;
              const s1End = s1EndHour * 60 + s1EndMin;
              const s2Start = s2StartHour * 60 + s2StartMin;
              const s2End = s2EndHour * 60 + s2EndMin;

              // Check if sessions overlap
              if (
                (s1Start < s2End && s1End > s2Start) ||
                (s2Start < s1End && s2End > s1Start)
              ) {
                return NextResponse.json(
                  { error: 'Sessions cannot overlap on the same day' },
                  { status: 400 }
                );
              }
            }
          }
        }
      }
    }

    // Create update data, only including valid fields from UpdateClassData
    const updateData: Partial<Class> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };
    
    // Only copy valid fields that exist in UpdateClassData
    if (data.name !== undefined) updateData.name = data.name;
    if (data.grade !== undefined) updateData.grade = data.grade;
    if (data.sessions !== undefined) updateData.sessions = data.sessions;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update only this class
    const result = await db
      .collection('classes')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Fetch updated class
    const updatedClass = await db
      .collection('classes')
      .findOne({ _id: new ObjectId(id) }) as Class | null;

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Delete class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    const result = await db.collection('classes').deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}

