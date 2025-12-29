import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// POST /api/games/reset-season
// Reset season for all students: move current season score to array, start new season with 0
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
        { error: 'Only teachers can reset season' },
        { status: 403 }
      );
    }

    // Get all student profiles
    const profiles = await db.collection('student_profiles').find({}).toArray();

    let resetCount = 0;

    for (const profile of profiles) {
      const seasonalScores = profile.seasonalScores || [0];
      const currentSeason = profile.currentSeason || 1;
      const currentSeasonScore = seasonalScores[seasonalScores.length - 1] || 0;

      // Move current season to array (already in array, just add new season with 0)
      const newSeasonalScores = [...seasonalScores, 0];
      const newCurrentSeason = currentSeason + 1;

      await db.collection('student_profiles').updateOne(
        { _id: profile._id },
        {
          $set: {
            seasonalScores: newSeasonalScores,
            currentSeason: newCurrentSeason,
            updatedAt: new Date(),
          },
        }
      );

      resetCount++;
    }

    return NextResponse.json({
      message: 'Season reset successfully',
      studentsReset: resetCount,
      newSeason: profiles.length > 0 ? (profiles[0].currentSeason || 1) + 1 : 1,
    });
  } catch (error) {
    console.error('Error resetting season:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

