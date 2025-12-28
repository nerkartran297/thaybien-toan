import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string; // Used for login
  email?: string; // Optional, not used for login
  password: string; // Hashed
  role: 'teacher' | 'student';
  avatar?: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Student-specific fields
  studentNumber?: number; // Auto-incremented number for students
  facebookName?: string; // Required for students
  note?: string; // Teacher notes about student
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserData {
  username: string; // Used for login
  email?: string; // Optional
  password: string;
  role: 'teacher' | 'student';
  avatar?: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Student-specific fields
  facebookName?: string; // Required for students
  note?: string; // Teacher notes about student
}

export interface UpdateUserData extends Partial<CreateUserData> {
  updatedAt?: Date;
}

