import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { addPointsToStudent } from '@/lib/score-utils';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// POST /api/games/save-score - Save game score
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { roomId, score, isFinal } = body;

    if (!roomId || score === undefined) {
      return NextResponse.json(
        { error: 'Missing roomId or score' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get student profile
    const studentProfile = await db.collection('student_profiles').findOne({
      userId: new ObjectId(userId),
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const studentId = studentProfile._id;

    // Check if game session already exists
    const existingSession = await db.collection('game_sessions').findOne({
      roomId: new ObjectId(roomId),
      studentId: studentId,
    });

    // Get current highest score (default to 0 if no session exists)
    const currentHighestScore = existingSession?.highestScore || 0;

    // Only update highestScore if current score is higher
    const newHighestScore = Math.max(currentHighestScore, score);

    const updateData: {
      score: number;
      highestScore: number;
      updatedAt: Date;
      endTime?: Date;
      isCompleted?: boolean;
      scoreAddedToCompetition?: boolean;
    } = {
      score, // Current temp score
      highestScore: newHighestScore, // Highest score achieved
      updatedAt: new Date(),
    };

    if (isFinal) {
      updateData.endTime = new Date();
      updateData.isCompleted = true;
    }

    if (existingSession) {
      // Update existing session
      if (existingSession.scoreAddedToCompetition === undefined) {
        updateData.scoreAddedToCompetition = false;
      }
      await db.collection('game_sessions').updateOne(
        { _id: existingSession._id },
        { $set: updateData }
      );
    } else {
      // Create new session
      await db.collection('game_sessions').insertOne({
        roomId: new ObjectId(roomId),
        studentId: studentId,
        score, // Current temp score
        highestScore: score, // Highest score (initially same as current)
        startTime: new Date(),
        endTime: isFinal ? new Date() : null,
        isCompleted: isFinal || false,
        scoreAddedToCompetition: false, // Initialize flag
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Only update competition score when room has fully ended
    const room = await db.collection('rooms').findOne({
      _id: new ObjectId(roomId),
    });

    if (room) {
      const now = new Date();
      const roomEnded =
        !room.isActive ||
        (room.endTime && new Date(room.endTime) < now);

      // Only add highestScore to competition score when room has fully ended
      if (roomEnded && newHighestScore > 0) {
        let sessionId = existingSession?._id;
        if (!sessionId) {
          const newSession = await db.collection('game_sessions').findOne({
            roomId: new ObjectId(roomId),
            studentId: studentId,
          });
          sessionId = newSession?._id;
        }

        if (sessionId) {
          // Use atomic operation to check and mark scoreAddedToCompetition
          const updateResult = await db.collection('game_sessions').updateOne(
            {
              _id: sessionId,
              scoreAddedToCompetition: { $ne: true },
            },
            {
              $set: { scoreAddedToCompetition: true },
            }
          );

          // Only add score if the update was successful
          if (updateResult.modifiedCount > 0) {
            // Add points to both lifetimeScore and current season
            await addPointsToStudent(db, studentId, newHighestScore);
          }
        }
      }
    }

    return NextResponse.json({ message: 'Score saved' });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

