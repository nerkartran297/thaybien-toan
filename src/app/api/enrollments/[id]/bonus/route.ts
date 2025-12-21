import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { StudentEnrollment } from '@/models/StudentEnrollment';
import { ObjectId } from 'mongodb';

// POST /api/enrollments/[id]/bonus - Add bonus sessions/weeks
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { bonusSessions, bonusWeeks } = await request.json();

    if ((!bonusSessions || bonusSessions < 0) && (!bonusWeeks || bonusWeeks < 0)) {
      return NextResponse.json(
        { error: 'Bonus sessions or weeks must be provided and non-negative' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const enrollment = await db
      .collection('enrollments')
      .findOne({ _id: new ObjectId(id) }) as StudentEnrollment | null;

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Bonus sessions: directly add to remainingSessions
    // Bonus weeks: only extend endDate (time to arrange classes), NOT add sessions
    const bonusSessionsCount = bonusSessions || 0;
    
    // Update remaining sessions (only from bonus sessions, NOT from bonus weeks)
    const newRemainingSessions = (enrollment.remainingSessions || 0) + bonusSessionsCount;

    // Update end date if bonus weeks provided
    // Bonus weeks only extend the time period, they don't add sessions
    let newEndDate = enrollment.endDate;
    if (bonusWeeks && bonusWeeks > 0) {
      newEndDate = new Date(enrollment.endDate);
      newEndDate.setDate(newEndDate.getDate() + bonusWeeks * 7);
    }

    const result = await db
      .collection('enrollments')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            remainingSessions: newRemainingSessions,
            endDate: newEndDate,
            updatedAt: new Date(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const updatedEnrollment = await db
      .collection('enrollments')
      .findOne({ _id: new ObjectId(id) }) as StudentEnrollment | null;

    return NextResponse.json(updatedEnrollment);
  } catch (error) {
    console.error('Error adding bonus:', error);
    return NextResponse.json(
      { error: 'Failed to add bonus' },
      { status: 500 }
    );
  }
}

