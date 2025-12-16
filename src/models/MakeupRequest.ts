import { ObjectId } from 'mongodb';

export interface MakeupRequest {
  _id?: ObjectId;
  studentId: ObjectId;
  enrollmentId: ObjectId;
  originalClassId?: ObjectId;
  originalSessionDate: Date;
  newClassId?: ObjectId;
  newSessionDate: Date;
  reason: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected'; // Auto-approved
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMakeupRequestData {
  studentId: ObjectId | string;
  enrollmentId: ObjectId | string;
  originalClassId?: ObjectId | string;
  originalSessionDate: Date | string;
  newClassId?: ObjectId | string;
  newSessionDate: Date | string;
  reason: string;
}

export interface UpdateMakeupRequestData {
  status?: 'pending' | 'approved' | 'rejected';
  updatedAt?: Date;
}

