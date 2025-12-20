import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Calculate competition points based on ranking
// Top 1: 20 points, Top 2: 15 points, Top 3: 10 points, Top 4-10: 5 points
function getCompetitionPoints(rank: number): number {
  if (rank === 1) return 20;
  if (rank === 2) return 15;
  if (rank === 3) return 10;
  if (rank >= 4 && rank <= 10) return 5;
  return 0;
}

// POST /api/games/calculate-competition-points
// Calculate and add competition points based on room leaderboard ranking
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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
        { error: 'Only teachers can calculate competition points' },
        { status: 403 }
      );
    }

    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    let roomObjectId: ObjectId;
    try {
      roomObjectId = new ObjectId(roomId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid room ID format' },
        { status: 400 }
      );
    }

    // Get room and verify it belongs to the teacher
    const room = await db.collection('rooms').findOne({
      _id: roomObjectId,
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Verify room belongs to teacher (if room has teacherId field)
    if (room.teacherId && room.teacherId.toString() !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to access this room' },
        { status: 403 }
      );
    }

    // Get all game sessions for this room, sorted by highestScore descending
    const gameSessions = await db
      .collection('game_sessions')
      .find({ roomId: roomObjectId })
      .sort({ highestScore: -1 })
      .toArray();

    if (gameSessions.length === 0) {
      return NextResponse.json({
        message: 'No game sessions found for this room',
        pointsAdded: 0,
      });
    }

    // Calculate points for each student based on their rank
    let pointsAdded = 0;
    const updates: Array<{
      studentId: ObjectId;
      points: number;
      rank: number;
    }> = [];

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
          const month = now.getMonth() + 1;
          const year = now.getFullYear();

          await db.collection('monthly_scores').updateOne(
            {
              studentId: session.studentId,
              month,
              year,
            },
            {
              $inc: { totalScore: points },
              $set: { updatedAt: new Date() },
              $setOnInsert: {
                createdAt: new Date(),
              },
            },
            { upsert: true }
          );

          pointsAdded += points;
          updates.push({
            studentId: session.studentId,
            points,
            rank,
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Competition points calculated and added successfully',
      pointsAdded,
      studentsUpdated: updates.length,
      updates,
    });
  } catch (error) {
    console.error('Error calculating competition points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

