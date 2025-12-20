import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/rooms/[id]/leaderboard - Get leaderboard for a room
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

    // Get room to check activity type
    const room = await db.collection('rooms').findOne({ _id: roomObjectId });
    const activityType = room ? ((room as any).activityType || room.gameType || 'snake') : 'snake';

    let leaderboard: Array<{
      rank: number;
      id: string;
      studentId: string;
      name: string;
      score: number;
      highestScore: number;
      currentScore?: number;
      updatedAt: Date | string;
    }> = [];

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

      // Limit to top 50
      const topAttempts = examAttempts.slice(0, 50);

      leaderboard = await Promise.all(
        topAttempts.map(async (attempt, index) => {
          if (!attempt.studentId) return null;

          // Get student profile
          const studentProfile = await db
            .collection('student_profiles')
            .findOne({ userId: attempt.studentId });

          if (!studentProfile) {
            console.warn(`Student profile not found for attempt ${attempt._id}, studentId: ${attempt.studentId}`);
            return null;
          }

          const studentUser = await db.collection('users').findOne({
            _id: attempt.studentId,
          });

          if (!studentUser) {
            console.warn(`User not found for studentId ${attempt.studentId}`);
            return null;
          }

          // Get name from fullName, name, or username
          const studentName = studentUser.fullName || (studentUser as any).name || studentUser.username || 'N/A';

          return {
            rank: index + 1,
            id: attempt._id.toString(),
            studentId: studentProfile._id.toString(),
            name: studentName,
            score: attempt.score || 0,
            highestScore: attempt.score || 0,
            currentScore: attempt.score || 0,
            updatedAt: attempt.submittedAt || attempt.createdAt,
          };
        })
      );
    } else if (activityType === 'quiz') {
      // For quiz activities: get quiz student scores sorted by totalScore
      const quizScores = await db
        .collection('quizStudentScores')
        .find({ roomId: roomObjectId })
        .sort({ totalScore: -1 })
        .toArray();

      // Limit to top 50
      const topScores = quizScores.slice(0, 50);

      leaderboard = await Promise.all(
        topScores.map(async (score, index) => {
          const studentProfile = await db
            .collection('student_profiles')
            .findOne({ _id: score.studentId });

          if (!studentProfile) {
            console.warn(`Student profile not found for score ${score._id}, studentId: ${score.studentId}`);
            return null;
          }

          if (!studentProfile.userId) {
            console.warn(`Student profile ${studentProfile._id} missing userId`);
            return null;
          }

          const studentUser = await db.collection('users').findOne({
            _id: studentProfile.userId,
          });

          if (!studentUser) {
            console.warn(`User not found for profile ${studentProfile._id}, userId: ${studentProfile.userId}`);
            return null;
          }

          // Get name from fullName, name, or username
          const studentName = studentUser.fullName || (studentUser as any).name || studentUser.username || 'N/A';

          return {
            rank: index + 1,
            id: score._id.toString(),
            studentId: studentProfile._id.toString(),
            name: studentName,
            score: score.totalScore || 0,
            highestScore: score.totalScore || 0,
            currentScore: score.totalScore || 0,
            updatedAt: score.updatedAt || score.createdAt,
          };
        })
      );
    } else {
      // For game activities (snake, quiz): get game sessions sorted by highestScore
      const gameSessions = await db
        .collection('game_sessions')
        .find({ roomId: roomObjectId })
        .sort({ highestScore: -1, score: -1 })
        .toArray();

      // Limit to top 50
      const topSessions = gameSessions.slice(0, 50);

      leaderboard = await Promise.all(
        topSessions.map(async (session, index) => {
          const studentProfile = await db
            .collection('student_profiles')
            .findOne({ _id: session.studentId });

          if (!studentProfile) {
            console.warn(`Student profile not found for session ${session._id}, studentId: ${session.studentId}`);
            return null;
          }

          if (!studentProfile.userId) {
            console.warn(`Student profile ${studentProfile._id} missing userId`);
            return null;
          }

          const studentUser = await db.collection('users').findOne({
            _id: studentProfile.userId,
          });

          if (!studentUser) {
            console.warn(`User not found for profile ${studentProfile._id}, userId: ${studentProfile.userId}`);
            return null;
          }

          // Get name from fullName, name, or username
          const studentName = studentUser.fullName || (studentUser as any).name || studentUser.username || 'N/A';

          return {
            rank: index + 1,
            id: session._id.toString(),
            studentId: session.studentId.toString(),
            name: studentName,
            score: session.highestScore || session.score || 0,
            highestScore: session.highestScore || session.score || 0,
            currentScore: session.score || 0,
            updatedAt: session.updatedAt || session.createdAt,
          };
        })
      );
    }

    return NextResponse.json({
      leaderboard: leaderboard.filter(
        (entry): entry is NonNullable<typeof entry> => entry !== null
      ),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

