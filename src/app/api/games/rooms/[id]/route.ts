import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/rooms/[id] - Get a specific room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const roomId = resolvedParams.id;

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    let roomObjectId: ObjectId;
    try {
      roomObjectId = new ObjectId(roomId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const room = await db.collection('rooms').findOne({
      _id: roomObjectId,
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const roomWithExtras = room as {
      activityType?: string;
      gameType?: string;
      examId?: ObjectId;
      quizId?: ObjectId;
    };
    return NextResponse.json({
      id: room._id.toString(),
      code: room.code,
      name: room.name,
      activityType: roomWithExtras.activityType || roomWithExtras.gameType || 'snake',
      gameType: roomWithExtras.activityType || roomWithExtras.gameType || 'snake', // Keep for backward compatibility
      startTime: room.startTime,
      endTime: room.endTime,
      duration: room.duration,
      isActive: room.isActive,
      createdAt: room.createdAt,
      examId: roomWithExtras.examId?.toString(),
      quizId: roomWithExtras.quizId?.toString(),
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/games/rooms/[id] - Update a room (teacher only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId),
    });

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can update rooms' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const roomId = resolvedParams.id;

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    let roomObjectId: ObjectId;
    try {
      roomObjectId = new ObjectId(roomId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    const room = await db.collection('rooms').findOne({
      _id: roomObjectId,
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Verify room belongs to teacher
    if (room.teacherId && room.teacherId.toString() !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this room' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name) updateData.name = body.name;
    // Support both activityType and gameType for backward compatibility
    const finalActivityType = body.activityType || body.gameType;
    if (finalActivityType) {
      updateData.activityType = finalActivityType;
      updateData.gameType = finalActivityType; // Keep for backward compatibility
    }
    if (body.examId) {
      updateData.examId = new ObjectId(body.examId);
    } else if (finalActivityType !== 'exam') {
      // Remove examId if activity type is not exam
      updateData.examId = null;
    }
    if (body.quizId) {
      updateData.quizId = new ObjectId(body.quizId);
    } else if (finalActivityType !== 'quiz') {
      // Remove quizId if activity type is not quiz
      updateData.quizId = null;
    }
    if (body.startTime !== undefined) {
      updateData.startTime = body.startTime ? new Date(body.startTime) : null;
    }
    if (body.endTime !== undefined) {
      updateData.endTime = body.endTime ? new Date(body.endTime) : null;
    }
    if (body.duration) updateData.duration = parseInt(body.duration);

    await db.collection('rooms').updateOne(
      { _id: roomObjectId },
      { $set: updateData }
    );

    const updatedRoom = await db.collection('rooms').findOne({
      _id: roomObjectId,
    });

    return NextResponse.json({
      id: updatedRoom._id.toString(),
      code: updatedRoom.code,
      name: updatedRoom.name,
      activityType: (() => {
        const room = updatedRoom as { activityType?: string; gameType?: string; examId?: ObjectId; quizId?: ObjectId };
        return room.activityType || room.gameType || 'snake';
      })(),
      gameType: (() => {
        const room = updatedRoom as { activityType?: string; gameType?: string };
        return room.activityType || room.gameType || 'snake';
      })(), // Keep for backward compatibility
      startTime: updatedRoom.startTime,
      endTime: updatedRoom.endTime,
      duration: updatedRoom.duration,
      isActive: updatedRoom.isActive,
      examId: (() => {
        const room = updatedRoom as { examId?: ObjectId };
        return room.examId?.toString();
      })(),
      quizId: (() => {
        const room = updatedRoom as { quizId?: ObjectId };
        return room.quizId?.toString();
      })(),
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/games/rooms/[id] - Delete a room (teacher only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId),
    });

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can delete rooms' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const roomId = resolvedParams.id;

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    let roomObjectId: ObjectId;
    try {
      roomObjectId = new ObjectId(roomId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    const room = await db.collection('rooms').findOne({
      _id: roomObjectId,
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Verify room belongs to teacher
    if (room.teacherId && room.teacherId.toString() !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this room' },
        { status: 403 }
      );
    }

    await db.collection('rooms').deleteOne({ _id: roomObjectId });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

