import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/competition-score - Get competition score for current student
export async function GET(request: NextRequest) {
  // Log request URL (required parameter but not used in logic)
  console.log(`Request URL: ${request.url?.substring(0, 50)}...`);
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get student profile
    const studentProfile = await db.collection('student_profiles').findOne({
      userId: new ObjectId(userId),
    });

    if (!studentProfile) {
      return NextResponse.json({
        competitionScore: 0,
        rank: null,
        totalStudents: 0,
      });
    }

    // Get rank by comparing with all students
    const allProfiles = await db
      .collection('student_profiles')
      .find({})
      .sort({ competitionScore: -1 })
      .toArray();

    const currentScore = studentProfile.competitionScore || 0;
    const rank = allProfiles.findIndex(
      (p) => p._id.toString() === studentProfile._id.toString()
    ) + 1;

    return NextResponse.json({
      competitionScore: currentScore,
      rank: rank > 0 ? rank : null,
      totalStudents: allProfiles.length,
    });
  } catch (error) {
    console.error('Error fetching competition score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

