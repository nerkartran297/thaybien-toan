import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Class } from '@/models/Class';
import { ObjectId } from 'mongodb';

// POST /api/classes/[id]/students - Add student to class
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if class exists
    const classData = await db
      .collection<Class>('classes')
      .findOne({ _id: new ObjectId(id) });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check if student is already enrolled
    const studentObjectId = new ObjectId(studentId);
    if (classData.enrolledStudents.some(id => id.toString() === studentObjectId.toString())) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this class' },
        { status: 400 }
      );
    }

    // Add student to class
    const result = await db
      .collection<Class>('classes')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $addToSet: { enrolledStudents: studentObjectId },
          $set: { updatedAt: new Date() },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Update enrollment status from pending to active if exists
    // Find enrollment with pending status for this student
    const { StudentEnrollment } = await import('@/models/StudentEnrollment');
    const pendingEnrollment = await db
      .collection<StudentEnrollment>('enrollments')
      .findOne({
        studentId: studentObjectId,
        status: 'pending',
      });

    if (pendingEnrollment) {
      // Update enrollment status to active
      await db
        .collection<StudentEnrollment>('enrollments')
        .updateOne(
          { _id: pendingEnrollment._id },
          {
            $set: {
              status: 'active',
              updatedAt: new Date(),
            },
          }
        );
    }

    // Update student profile: sync class name to group and class grade to grade
    await db.collection('student_profiles').updateOne(
      { userId: studentObjectId },
      {
        $set: {
          group: classData.name,
          grade: classData.grade,
          updatedAt: new Date(),
        },
      }
    );

    // Fetch updated class
    const updatedClass = await db
      .collection<Class>('classes')
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error('Error adding student to class:', error);
    return NextResponse.json(
      { error: 'Failed to add student to class' },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id]/students - Remove student from class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if class exists
    const classData = await db
      .collection<Class>('classes')
      .findOne({ _id: new ObjectId(id) });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Remove student from class
    const result = await db
      .collection<Class>('classes')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { enrolledStudents: new ObjectId(studentId) },
          $set: { updatedAt: new Date() },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check if student is still in any other class
    const studentObjectId = new ObjectId(studentId);
    const otherClasses = await db
      .collection<Class>('classes')
      .find({
        enrolledStudents: studentObjectId,
        _id: { $ne: new ObjectId(id) },
      })
      .toArray();

    // If student is not in any other class, clear group and grade
    // Otherwise, update to the first other class's values
    if (otherClasses.length === 0) {
      // Student is not in any class, clear group and grade
      await db.collection('student_profiles').updateOne(
        { userId: studentObjectId },
        {
          $set: {
            group: null,
            grade: null,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Student is in other classes, update to the first class's values
      const firstClass = otherClasses[0];
      await db.collection('student_profiles').updateOne(
        { userId: studentObjectId },
        {
          $set: {
            group: firstClass.name,
            grade: firstClass.grade,
            updatedAt: new Date(),
          },
        }
      );
    }

    // Fetch updated class
    const updatedClass = await db
      .collection<Class>('classes')
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error('Error removing student from class:', error);
    return NextResponse.json(
      { error: 'Failed to remove student from class' },
      { status: 500 }
    );
  }
}

