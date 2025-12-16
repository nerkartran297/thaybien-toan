import { ObjectId } from 'mongodb';

export interface ClassSession {
  dayOfWeek: number; // 0-6 (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  startTime: string; // HH:mm format (e.g., "08:00")
  endTime: string; // HH:mm format (e.g., "09:30")
}

export interface Class {
  _id?: ObjectId;
  name: string;
  grade: number; // 6, 7, 8, 9, 10, 11, 12
  sessions: ClassSession[]; // Array of class sessions (unlimited)
  enrolledStudents: ObjectId[]; // Array of student IDs
  isActive: boolean;
  cancelledDates?: Date[]; // Array of dates when this class was cancelled
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateClassData {
  name: string;
  grade: number; // 6, 7, 8, 9, 10, 11, 12
  sessions: ClassSession[]; // Array of class sessions
}

export interface UpdateClassData {
  name?: string;
  grade?: number;
  sessions?: ClassSession[];
  isActive?: boolean;
  updatedAt?: Date;
}

