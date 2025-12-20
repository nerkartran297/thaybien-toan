import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// POST /api/games/rooms/[id]/end - End a room and calculate competition points (teacher only)
export async function POST(
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

    const db = await getDatabase();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId),
    });

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can end rooms' },
        { status: 403 }
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
        { error: 'Unauthorized to end this room' },
        { status: 403 }
      );
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: 'Room is not active' },
        { status: 400 }
      );
    }

    // End the room
    await db.collection('rooms').updateOne(
      { _id: roomObjectId },
      {
        $set: {
          isActive: false,
          endTime: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Calculate and add competition points based on ranking
    const activityType = (room as any).activityType || room.gameType || 'snake';
    
    let pointsAdded = 0;
    const updates: Array<{
      studentId: string;
      points: number;
      rank: number;
    }> = [];

    // Calculate points for each student based on their rank
    // Top 1: 20 points, Top 2: 15 points, Top 3: 10 points, Top 4-10: 5 points
    function getCompetitionPoints(rank: number): number {
      if (rank === 1) return 20;
      if (rank === 2) return 15;
      if (rank === 3) return 10;
      if (rank >= 4 && rank <= 10) return 5;
      return 0;
    }

    if (activityType === 'exam') {
      // For exam activities: get exam attempts sorted by score
      const examAttempts = await db
        .collection('examAttempts')
        .find({
          roomId: roomObjectId,
          submittedAt: { $exists: true, $ne: null }, // Only submitted attempts
        })
        .sort({ score: -1, submittedAt: 1 }) // Sort by score descending, then by submission time
        .toArray();

      for (let i = 0; i < examAttempts.length; i++) {
        const attempt = examAttempts[i];
        const rank = i + 1;
        const points = getCompetitionPoints(rank);

        if (points > 0 && attempt.studentId) {
          // Get student profile
          const studentProfile = await db
            .collection('student_profiles')
            .findOne({ userId: attempt.studentId });

          if (!studentProfile) continue;

          // Check if points already added for this room (prevent duplicate)
          const competitionPointsRecord = await db
            .collection('competition_points')
            .findOne({
              roomId: roomObjectId,
              studentId: studentProfile._id,
            });

          if (!competitionPointsRecord) {
            // Add points to student profile
            await db.collection('student_profiles').updateOne(
              { _id: studentProfile._id },
              {
                $inc: { competitionScore: points },
                $set: { updatedAt: new Date() },
              }
            );

            // Record that points were added for this room
            await db.collection('competition_points').insertOne({
              roomId: roomObjectId,
              studentId: studentProfile._id,
              points,
              rank,
              addedAt: new Date(),
            });

            // Update monthly score in student_profiles.monthly_scores
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            await db.collection('student_profiles').updateOne(
              { _id: studentProfile._id },
              {
                $inc: { [`monthly_scores.${monthKey}`]: points },
                $set: { updatedAt: new Date() },
              }
            );

            pointsAdded += points;
            updates.push({
              studentId: studentProfile._id.toString(),
              points,
              rank,
            });
          }
        }
      }
    } else {
      // For game activities (snake, quiz): get game sessions sorted by highestScore
      const gameSessions = await db
        .collection('game_sessions')
        .find({ roomId: roomObjectId })
        .sort({ highestScore: -1 })
        .toArray();

      for (let i = 0; i < gameSessions.length; i++) {
        const session = gameSessions[i];
        const rank = i + 1;
        const points = getCompetitionPoints(rank);

        if (points > 0) {
          // Check if points already added for this room (prevent duplicate)
          const competitionPointsRecord = await db
            .collection('competition_points')
            .findOne({
              roomId: roomObjectId,
              studentId: session.studentId,
            });

          if (!competitionPointsRecord) {
            // Add points to student profile
            await db.collection('student_profiles').updateOne(
              { _id: session.studentId },
              {
                $inc: { competitionScore: points },
                $set: { updatedAt: new Date() },
              }
            );

            // Record that points were added for this room
            await db.collection('competition_points').insertOne({
              roomId: roomObjectId,
              studentId: session.studentId,
              points,
              rank,
              addedAt: new Date(),
            });

            // Update monthly score
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            await db.collection('student_profiles').updateOne(
              { _id: session.studentId },
              {
                $inc: { [`monthly_scores.${monthKey}`]: points },
                $set: { updatedAt: new Date() },
              }
            );

            pointsAdded += points;
            updates.push({
              studentId: session.studentId.toString(),
              points,
              rank,
            });
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Room ended successfully',
      competitionPointsAdded: pointsAdded,
      studentsUpdated: updates.length,
    });
  } catch (error) {
    console.error('Error ending room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

