import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { User, CreateUserData } from '@/models/User';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET /api/students - Get all students
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const students = await db
      .collection<User>('users')
      .find({ role: 'student' })
      .toArray();

    // Get enrollment counts and profiles for each student
    const studentsWithEnrollments = await Promise.all(
      students.map(async (student) => {
        const { password, ...studentWithoutPassword } = student;
        const enrollmentCount = await db
          .collection('enrollments')
          .countDocuments({ studentId: student._id });
        
        // Get student profile
        const profile = await db
          .collection('student_profiles')
          .findOne({ userId: student._id });
        
        return {
          ...studentWithoutPassword,
          enrollmentCount,
          grade: profile?.grade || null,
          group: profile?.group || null,
        };
      })
    );

    return NextResponse.json(studentsWithEnrollments);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST /api/students - Create new student
export async function POST(request: NextRequest) {
  try {
    const data: CreateUserData = await request.json();

    // Validate required fields
    if (!data.username || !data.password || !data.fullName || !data.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const db = await getDatabase();
    const existingUser = await db
      .collection<User>('users')
      .findOne({ username: data.username });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Tên tài khoản đã được sử dụng' },
        { status: 400 }
      );
    }

    // Auto-increment studentNumber: find the highest studentNumber and add 1
    const lastStudent = await db
      .collection<User>('users')
      .findOne(
        { role: 'student', studentNumber: { $exists: true } },
        { sort: { studentNumber: -1 } }
      );
    
    const nextStudentNumber = lastStudent?.studentNumber 
      ? lastStudent.studentNumber + 1 
      : 1;

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const student: User = {
      ...data,
      password: hashedPassword,
      role: 'student',
      studentNumber: nextStudentNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<User>('users').insertOne(student);

    // Create student profile with new structure
    await db.collection('student_profiles').insertOne({
      userId: result.insertedId,
      grade: null,
      group: null,
      competitionScore: 0,
      status: 'PENDING',
      notes: null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Remove password from response
    const { password, ...studentWithoutPassword } = {
      ...student,
      _id: result.insertedId,
    };

    return NextResponse.json(studentWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

