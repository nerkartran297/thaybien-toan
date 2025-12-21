import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Helper function to get date range based on period
function getDateRange(period: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  let start: Date | null = null;
  const end: Date | null = now;

  switch (period) {
    case 'week': {
      // Start of current week (Monday)
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'month': {
      // Start of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'quarter': {
      // Start of current quarter
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'all':
    default:
      start = null; // All time
      break;
  }

  return { start, end };
}

// GET /api/games/leaderboard - Get global leaderboard
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, week, month, quarter
    const scope = searchParams.get('scope') || 'class'; // class, grade, all (only for teachers)
    const grade = searchParams.get('grade') || null; // Specific grade filter (for teachers)
    const group = searchParams.get('group') || null; // Specific group/class filter (for teachers)

    // Get student profile for filtering and getting user's own stats
    const studentProfile = await db.collection('student_profiles').findOne({
      userId: new ObjectId(userId),
    });

    // Build query based on scope
    const profileQuery: Record<string, unknown> = {};

    if (user.role === 'student') {
      // Students can only see their own class and grade
      if (studentProfile) {
        if (scope === 'class' && studentProfile.group) {
          profileQuery.group = studentProfile.group;
        } else if (scope === 'grade' && studentProfile.grade) {
          profileQuery.grade = studentProfile.grade;
        }
      }
    } else if (user.role === 'teacher') {
      // Teachers can choose scope with specific grade/group filters
      if (scope === 'all') {
        // No filter - show all students
        profileQuery = {};
      } else if (scope === 'grade') {
        // Filter by grade - use provided grade
        if (grade) {
          // Normalize grade - trim and try to match both string and number
          const normalizedGrade = grade.trim();
          const gradeNum = parseInt(normalizedGrade, 10);
          
          // Try to match both string and number formats
          if (!isNaN(gradeNum)) {
            profileQuery.$or = [
              { grade: normalizedGrade },
              { grade: gradeNum },
              { grade: gradeNum.toString() },
            ];
          } else {
            profileQuery.grade = normalizedGrade;
          }
        } else {
          // If no grade specified, show all
          profileQuery = {};
        }
      } else if (scope === 'class') {
        // Filter by class - use provided group
        if (group) {
          profileQuery.group = group;
        } else {
          // If no group specified, show all
          profileQuery = {};
        }
        // Note: When filtering by class, we don't filter by grade
        // because a class (group) already implies a specific grade
      }
    }

    // Get date range based on period
    const { start, end } = getDateRange(period);

    // Get all student profiles matching the query
    // Debug: log the query
    console.log('Leaderboard query:', JSON.stringify(profileQuery, null, 2));
    let profiles = await db
      .collection('student_profiles')
      .find(profileQuery)
      .toArray();
    console.log(`Found ${profiles.length} profiles matching query`);

    // If period is not 'all', filter by monthly_scores
    if (start && period !== 'all') {
      const filteredProfiles = await Promise.all(
        profiles.map(async (profile) => {
          // Calculate score for the period from monthly_scores
          const monthlyScores = profile.monthly_scores || {};
          let periodScore = 0;

          if (period === 'week') {
            // Sum scores from the current week's months
            const weekStartMonth = `${start!.getFullYear()}-${String(start!.getMonth() + 1).padStart(2, '0')}`;
            periodScore = monthlyScores[weekStartMonth] || 0;
          } else if (period === 'month') {
            const monthKey = `${start!.getFullYear()}-${String(start!.getMonth() + 1).padStart(2, '0')}`;
            periodScore = monthlyScores[monthKey] || 0;
          } else if (period === 'quarter') {
            // Sum scores from all months in the quarter
            const quarterStartMonth = start!.getMonth();
            for (let i = 0; i < 3; i++) {
              const month = quarterStartMonth + i;
              const monthKey = `${start!.getFullYear()}-${String(month + 1).padStart(2, '0')}`;
              periodScore += monthlyScores[monthKey] || 0;
            }
          }

          return {
            ...profile,
            periodScore,
          };
        })
      );

      // Sort by periodScore
      filteredProfiles.sort((a, b) => b.periodScore - a.periodScore);
      profiles = filteredProfiles.slice(0, 25); // Top 25
    } else {
      // Sort by competitionScore for all-time
      profiles.sort((a, b) => (b.competitionScore || 0) - (a.competitionScore || 0));
      profiles = profiles.slice(0, 25); // Top 25
    }

    // Get user info for each profile
    const leaderboard = await Promise.all(
      profiles.map(async (profile, index) => {
        const studentUser = await db.collection('users').findOne({
          _id: profile.userId,
        });

        if (!studentUser) return null;

        const profileWithPeriod = profile as { periodScore?: number; competitionScore?: number };
        const score = period !== 'all' ? (profileWithPeriod.periodScore || 0) : (profile.competitionScore || 0);
        const userWithName = studentUser as { fullName?: string; name?: string; username?: string };
        return {
          rank: index + 1,
          studentId: profile._id.toString(),
          name: userWithName.fullName || userWithName.name || userWithName.username || 'N/A',
          score,
          grade: profile.grade || null,
          group: profile.group || null,
        };
      })
    );

    // Get current user's rank and score
    let myRank: number | null = null;
    let myScore = 0;

    if (studentProfile) {
      if (period !== 'all') {
        const monthlyScores = studentProfile.monthly_scores || {};
        if (period === 'week') {
          const weekStartMonth = `${start!.getFullYear()}-${String(start!.getMonth() + 1).padStart(2, '0')}`;
          myScore = monthlyScores[weekStartMonth] || 0;
        } else if (period === 'month') {
          const monthKey = `${start!.getFullYear()}-${String(start!.getMonth() + 1).padStart(2, '0')}`;
          myScore = monthlyScores[monthKey] || 0;
        } else if (period === 'quarter') {
          const quarterStartMonth = start!.getMonth();
          for (let i = 0; i < 3; i++) {
            const month = quarterStartMonth + i;
            const monthKey = `${start!.getFullYear()}-${String(month + 1).padStart(2, '0')}`;
            myScore += monthlyScores[monthKey] || 0;
          }
        }
      } else {
        myScore = studentProfile.competitionScore || 0;
      }

      // Find rank
      myRank = leaderboard.findIndex(
        (entry) => entry && entry.studentId === studentProfile._id.toString()
      ) + 1;
      if (myRank === 0) myRank = null;
    }

    return NextResponse.json({
      leaderboard: leaderboard.filter(
        (entry): entry is NonNullable<typeof entry> => entry !== null
      ),
      myRank,
      myScore,
      period,
      scope,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

