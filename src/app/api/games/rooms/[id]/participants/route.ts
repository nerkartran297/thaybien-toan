import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/rooms/[id]/participants - Get list of students who joined the room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    const resolvedParams = params instanceof Promise ? await params : params;
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

    // Get all participants for this room
    const participants = await db
      .collection('room_participants')
      .find({ roomId: roomObjectId })
      .sort({ joinedAt: -1 })
      .toArray();

    // Get student info for each participant
    const participantsWithInfo = await Promise.all(
      participants.map(async (participant) => {
        const studentProfile = await db
          .collection('student_profiles')
          .findOne({ _id: participant.studentId });

        if (!studentProfile) return null;

        const studentUser = await db.collection('users').findOne({
          _id: studentProfile.userId,
        });

        if (!studentUser) return null;

        return {
          studentId: participant.studentId.toString(),
          name: studentUser.fullName || (studentUser as any).name || studentUser.username || 'N/A',
          joinedAt: participant.joinedAt,
        };
      })
    );

    return NextResponse.json({
      participants: participantsWithInfo.filter(
        (p): p is NonNullable<typeof p> => p !== null
      ),
      count: participantsWithInfo.filter((p) => p !== null).length,
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

