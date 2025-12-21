import { ObjectId } from 'mongodb';

export interface Attendance {
  _id?: ObjectId;
  studentId: ObjectId;
  enrollmentId?: ObjectId; // Optional - no longer required
  classId?: ObjectId;
  sessionDate: Date;
  status: 'present' | 'absent' | 'excused' | 'makeup';
  notes?: string;
  markedBy: ObjectId; // Teacher ID
  markedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAttendanceData {
  studentId: ObjectId | string;
  enrollmentId?: ObjectId | string; // Optional - no longer required
  classId?: ObjectId | string;
  sessionDate: Date | string;
  status: 'present' | 'absent' | 'excused' | 'makeup';
  notes?: string;
  markedBy: ObjectId | string;
}

export interface UpdateAttendanceData {
  status?: 'present' | 'absent' | 'excused' | 'makeup';
  notes?: string;
  updatedAt?: Date;
}

