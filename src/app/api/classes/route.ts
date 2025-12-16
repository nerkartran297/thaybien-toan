import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Class, CreateClassData } from '@/models/Class';
import { ObjectId } from 'mongodb';

// GET /api/classes - Get all classes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    const isActive = searchParams.get('isActive');

    const db = await getDatabase();
    const query: {
      grade?: number;
      isActive?: boolean;
    } = {};

    if (grade) {
      query.grade = parseInt(grade);
    }
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    const classes = await db.collection<Class>('classes').find(query).toArray();

    // Serialize ObjectIds in enrolledStudents to strings for easier comparison on client
    const serializedClasses = classes.map(cls => ({
      ...cls,
      _id: cls._id?.toString(),
      enrolledStudents: cls.enrolledStudents?.map(id => 
        typeof id === 'string' ? id : id?.toString()
      ) || [],
    }));

    return NextResponse.json(serializedClasses);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create new class
export async function POST(request: NextRequest) {
  try {
    const data: CreateClassData = await request.json();

    // Validate required fields
    if (!data.name || !data.grade || !data.sessions || data.sessions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, grade, and at least one session' },
        { status: 400 }
      );
    }

    // Validate grade
    if (![6, 7, 8, 9, 10, 11, 12].includes(data.grade)) {
      return NextResponse.json(
        { error: 'Grade must be between 6 and 12' },
        { status: 400 }
      );
    }

    // Validate sessions
    for (const session of data.sessions) {
      if (session.dayOfWeek < 0 || session.dayOfWeek > 6) {
        return NextResponse.json(
          { error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' },
          { status: 400 }
        );
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(session.startTime) || !timeRegex.test(session.endTime)) {
        return NextResponse.json(
          { error: 'Time must be in HH:mm format' },
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

    const db = await getDatabase();

    // Check for time conflicts with existing classes
    // All classes repeat weekly, so check conflicts on the same dayOfWeek
    const existingClasses = await db.collection<Class>('classes').find({
      isActive: true,
      grade: data.grade,
    }).toArray();

    for (const existingClass of existingClasses) {
      for (const existingSession of existingClass.sessions || []) {
        for (const newSession of data.sessions) {
          // Check if same day of week and overlapping time
          if (existingSession.dayOfWeek === newSession.dayOfWeek) {
            const [existingStartHour, existingStartMin] = existingSession.startTime.split(':').map(Number);
            const [existingEndHour, existingEndMin] = existingSession.endTime.split(':').map(Number);
            const [newStartHour, newStartMin] = newSession.startTime.split(':').map(Number);
            const [newEndHour, newEndMin] = newSession.endTime.split(':').map(Number);
            
            const existingStartMinutes = existingStartHour * 60 + existingStartMin;
            const existingEndMinutes = existingEndHour * 60 + existingEndMin;
            const newStartMinutes = newStartHour * 60 + newStartMin;
            const newEndMinutes = newEndHour * 60 + newEndMin;
            
            // Check if times overlap
            if (newStartMinutes < existingEndMinutes && existingStartMinutes < newEndMinutes) {
              return NextResponse.json(
                { error: `Lớp học trùng giờ với lớp "${existingClass.name}" (${existingSession.startTime} - ${existingSession.endTime})` },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    // Create class
    const classData: Class = {
      name: data.name,
      grade: data.grade,
      sessions: data.sessions,
      enrolledStudents: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Class>('classes').insertOne(classData);

    return NextResponse.json(
      { ...classData, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}

