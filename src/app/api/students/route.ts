import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { User, CreateUserData } from '@/models/User';
// import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET /api/students - Get all students
export async function GET(request: NextRequest) {
  // Log request URL (required parameter but not used in logic)
  console.log(`Request URL: ${request.url?.substring(0, 50)}...`);
  try {
    const db = await getDatabase();
    const students = await db
      .collection('users')
      .find({ role: 'student' })
      .toArray();

    // Get enrollment counts and profiles for each student
    const studentsWithEnrollments = await Promise.all(
      students.map(async (student) => {
        const { password: _password, ...studentWithoutPassword } = student;
        console.log(`Password hash: ${_password?.substring(0, 10)}...`);
        const enrollments = await db
          .collection('enrollments')
          .find({ studentId: student._id })
          .toArray();
        const enrollmentCount = enrollments.length;
        
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
      .collection('users')
      .findOne({ username: data.username });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Tên tài khoản đã được sử dụng' },
        { status: 400 }
      );
    }

    // Auto-increment studentNumber: find the highest studentNumber and add 1
    const students = await db
      .collection('users')
      .find({ role: 'student', studentNumber: { $exists: true } })
      .sort({ studentNumber: -1 })
      .toArray();
    const lastStudent = students[0] || null;
    
    const nextStudentNumber = lastStudent?.studentNumber 
      ? lastStudent.studentNumber + 1 
      : 1;

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const DEFAULT_AVATAR = "/avatars/default.png";

    const student: User = {
      ...data,
      avatar: data.avatar ?? DEFAULT_AVATAR,
      password: hashedPassword,
      role: 'student',
      studentNumber: nextStudentNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Ensure password is set (override any password from data spread)
    student.password = hashedPassword;

    const result = await db.collection('users').insertOne(student);
    
    // Verify password was saved correctly
    const savedUser = await db.collection('users').findOne({ _id: result.insertedId });
    if (!savedUser?.password) {
      console.error('ERROR: User created but password was not saved!', {
        userId: result.insertedId,
        username: data.username,
      });
    }

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
    const { password: _password, ...studentWithoutPassword } = {
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

