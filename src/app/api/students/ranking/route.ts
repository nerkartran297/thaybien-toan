import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/students/ranking?studentId=xxx
// Get ranking for a specific student (grade rank and global rank based on currentSeasonScore)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get student profile
    const student = await db.collection('users').findOne({
      _id: new ObjectId(studentId),
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
      return NextResponse.json({
        gradeRank: null,
        gradeTotal: 0,
        globalRank: null,
        globalTotal: 0,
        currentSeasonScore: 0,
      });
    }

    const studentGrade = profile.grade;
    const seasonalScores = profile.seasonalScores || [0];
    const currentSeasonScore = seasonalScores[seasonalScores.length - 1] || 0;

    // Get all student profiles with currentSeasonScore
    const allProfiles = await db
      .collection('student_profiles')
      .find({})
      .toArray();

    // Calculate currentSeasonScore for each profile and sort
    const profilesWithScores = allProfiles.map((p) => {
      const scores = p.seasonalScores || [0];
      return {
        userId: p.userId,
        grade: p.grade,
        currentSeasonScore: scores[scores.length - 1] || 0,
      };
    });

    // Sort by currentSeasonScore descending
    profilesWithScores.sort((a, b) => b.currentSeasonScore - a.currentSeasonScore);

    // Find global rank
    const globalIndex = profilesWithScores.findIndex(
      (p) => p.userId.toString() === student._id.toString()
    );
    const globalRank = globalIndex >= 0 ? globalIndex + 1 : null;
    const globalTotal = profilesWithScores.length;

    // Filter by grade and find grade rank
    let gradeRank: number | null = null;
    let gradeTotal = 0;

    if (studentGrade !== null && studentGrade !== undefined) {
      const gradeProfiles = profilesWithScores.filter(
        (p) => p.grade === studentGrade || p.grade?.toString() === studentGrade?.toString()
      );
      gradeTotal = gradeProfiles.length;

      const gradeIndex = gradeProfiles.findIndex(
        (p) => p.userId.toString() === student._id.toString()
      );
      gradeRank = gradeIndex >= 0 ? gradeIndex + 1 : null;
    }

    return NextResponse.json({
      gradeRank,
      gradeTotal,
      globalRank,
      globalTotal,
      currentSeasonScore,
    });
  } catch (error) {
    console.error('Error fetching student ranking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ranking' },
      { status: 500 }
    );
  }
}

