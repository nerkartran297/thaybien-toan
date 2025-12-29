import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { addPointsToStudent } from '@/lib/score-utils';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// POST /api/students/[id]/add-points
// Add points to student (both lifetimeScore and current season)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Only teachers can add points' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { points } = await request.json();

    if (points === undefined || points === null || isNaN(points)) {
      return NextResponse.json(
        { error: 'Points is required and must be a number' },
        { status: 400 }
      );
    }

    // Get student profile
    const student = await db.collection('users').findOne({
      _id: new ObjectId(id),
      role: 'student',
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const profile = await db
      .collection('student_profiles')
      .findOne({ userId: student._id });

    if (!profile) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    if (!profile._id) {
      console.error('Profile found but missing _id:', profile);
      return NextResponse.json(
        { error: 'Student profile has invalid ID' },
        { status: 500 }
      );
    }

    // Add points using helper function
    try {
      await addPointsToStudent(db, profile._id, points);
    } catch (error) {
      console.error('Error in addPointsToStudent:', error);
      throw error;
    }

    // Get updated profile
    const updatedProfile = await db
      .collection('student_profiles')
      .findOne({ userId: student._id });

    const seasonalScores = updatedProfile?.seasonalScores || [0];
    const currentSeasonScore = seasonalScores[seasonalScores.length - 1] || 0;

    return NextResponse.json({
      success: true,
      studentId: id,
      pointsAdded: points,
      lifetimeScore: updatedProfile?.lifetimeScore || 0,
      currentSeasonScore: currentSeasonScore,
    });
  } catch (error) {
    console.error('Error adding points to student:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add points';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

