import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ObjectId } from 'mongodb';

// POST /api/students/batch-update - Batch update student numbers and notes
export async function POST(request: NextRequest) {
  try {
    const data: Array<{
      studentId: string;
      studentNumber?: number;
      note?: string;
    }> = await request.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const updatePromises = data.map(async (item) => {
      const updateData: Partial<User> & { updatedAt: Date } = {
        updatedAt: new Date(),
      };

      if (item.studentNumber !== undefined) {
        updateData.studentNumber = item.studentNumber;
      }

      if (item.note !== undefined) {
        updateData.note = item.note;
      }

      return db.collection('users').updateOne(
        { _id: new ObjectId(item.studentId), role: 'student' },
        { $set: updateData }
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ message: 'Students updated successfully' });
  } catch (error) {
    console.error('Error batch updating students:', error);
    return NextResponse.json(
      { error: 'Failed to update students' },
      { status: 500 }
    );
  }
}

