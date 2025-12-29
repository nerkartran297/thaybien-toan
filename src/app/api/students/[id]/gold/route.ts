import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/students/[id]/gold - Get student gold
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    // Check if student exists
    const student = await db.collection('users').findOne({
      _id: new ObjectId(id),
      role: 'student',
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get student profile
    const profile = await db
      .collection('student_profiles')
      .findOne({ userId: new ObjectId(id) });

    return NextResponse.json({
      gold: profile?.gold || 0,
    });
  } catch (error) {
    console.error('Error fetching student gold:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student gold' },
      { status: 500 }
    );
  }
}

// PATCH /api/students/[id]/gold - Update student gold (add or subtract)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { amount, operation = 'set' } = await request.json(); // operation: 'set' | 'add' | 'subtract'
    const db = await getDatabase();

    if (typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount must be a number' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await db.collection('users').findOne({
      _id: new ObjectId(id),
      role: 'student',
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get current profile
    const profile = await db
      .collection('student_profiles')
      .findOne({ userId: new ObjectId(id) });

    const currentGold = profile?.gold || 0;

    let newGold: number;
    if (operation === 'set') {
      newGold = Math.max(0, amount); // Ensure non-negative
    } else if (operation === 'add') {
      newGold = Math.max(0, currentGold + amount);
    } else if (operation === 'subtract') {
      newGold = Math.max(0, currentGold - amount);
    } else {
      return NextResponse.json(
        { error: 'Invalid operation. Use "set", "add", or "subtract"' },
        { status: 400 }
      );
    }

    // Update or create student profile
    await db.collection('student_profiles').updateOne(
      { userId: new ObjectId(id) },
      {
        $set: {
          gold: newGold,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId: new ObjectId(id),
          competitionScore: 0,
          grade: null,
          group: null,
          status: 'ACTIVE',
          notes: null,
          dateOfBirth: null,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      gold: newGold,
      previousGold: currentGold,
      operation,
    });
  } catch (error) {
    console.error('Error updating student gold:', error);
    return NextResponse.json(
      { error: 'Failed to update student gold' },
      { status: 500 }
    );
  }
}

