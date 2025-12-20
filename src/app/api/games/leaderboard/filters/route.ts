import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { ObjectId } from 'mongodb';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// GET /api/games/leaderboard/filters - Get available grades and groups for filtering
export async function GET(request: NextRequest) {
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
        { error: 'Only teachers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get query parameter for grade filter (optional)
    const { searchParams } = new URL(request.url);
    const gradeFilter = searchParams.get('grade') || null;

    // Get all unique grades and groups from student_profiles
    let profileQuery: any = {};
    if (gradeFilter) {
      profileQuery.grade = gradeFilter;
    }

    const profiles = await db
      .collection('student_profiles')
      .find(profileQuery)
      .toArray();

    const grades = new Set<string>();
    const groups = new Set<string>();
    const gradeGroupMap: Record<string, Set<string>> = {};

    profiles.forEach((profile) => {
      if (profile.grade) {
        grades.add(profile.grade);
        if (!gradeGroupMap[profile.grade]) {
          gradeGroupMap[profile.grade] = new Set<string>();
        }
        if (profile.group) {
          groups.add(profile.group);
          gradeGroupMap[profile.grade].add(profile.group);
        }
      } else if (profile.group) {
        groups.add(profile.group);
      }
    });

    // Convert gradeGroupMap to object with arrays
    const gradeGroups: Record<string, string[]> = {};
    Object.keys(gradeGroupMap).forEach((grade) => {
      gradeGroups[grade] = Array.from(gradeGroupMap[grade]).sort();
    });

    return NextResponse.json({
      grades: Array.from(grades).sort(),
      groups: Array.from(groups).sort(),
      gradeGroups, // Mapping of grade to groups
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

