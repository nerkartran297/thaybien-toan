import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { User, UpdateUserData } from '@/models/User';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET /api/students/[id] - Get student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const student = await db.collection('users').findOne({
      _id: new ObjectId(id),
      role: 'student',
    }) as User | null;

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Remove password from response
    const { password: _password, ...studentWithoutPassword } = student;
    console.log(`Password hash: ${_password?.substring(0, 10)}...`);

    return NextResponse.json(studentWithoutPassword);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data: UpdateUserData = await request.json();
    const db = await getDatabase();

    // Check if student exists
    const existingStudent = await db.collection('users').findOne({
      _id: new ObjectId(id),
      role: 'student',
    }) as User | null;

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // If username is being updated, check if it's already taken
    if (data.username && data.username !== existingStudent.username) {
      const usernameExists = await db
        .collection('users')
        .findOne({ username: data.username }) as User | null;

      if (usernameExists) {
        return NextResponse.json(
          { error: 'Tên tài khoản đã được sử dụng' },
          { status: 400 }
        );
      }
    }

    // Hash password if provided
    const updateData: Partial<User> & { updatedAt: Date; password?: string } = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const result = await db
      .collection('users')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch updated student
    const updatedStudent = await db.collection('users').findOne({
      _id: new ObjectId(id),
    }) as User | null;

    // Remove password from response
    const { password: _password, ...studentWithoutPassword } = updatedStudent!;
    console.log(`Password hash: ${_password?.substring(0, 10)}...`);

    return NextResponse.json(studentWithoutPassword);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();

    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(id),
      role: 'student',
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}

