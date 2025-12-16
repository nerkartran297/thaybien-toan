import { ObjectId } from 'mongodb';

export interface AbsenceRequest {
  _id?: ObjectId;
  studentId: ObjectId;
  enrollmentId: ObjectId;
  classId?: ObjectId;
  sessionDate: Date;
  reason: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected'; // Auto-approved
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAbsenceRequestData {
  studentId: ObjectId | string;
  enrollmentId: ObjectId | string;
  classId?: ObjectId | string;
  sessionDate: Date | string;
  reason: string;
}

export interface UpdateAbsenceRequestData {
  status?: 'pending' | 'approved' | 'rejected';
  updatedAt?: Date;
}

