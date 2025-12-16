import { ObjectId } from 'mongodb';

export interface Course {
  _id?: ObjectId;
  name: string; // "Khóa kèm 1-1 Online", "Khóa nhóm offline", etc.
  type: '1-1' | '1-2' | 'group';
  format: 'online' | 'offline';
  maxStudents: number; // 1, 2, or 7
  totalSessions: number; // Always 12
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCourseData {
  name: string;
  type: '1-1' | '1-2' | 'group';
  format: 'online' | 'offline';
  maxStudents: number;
  totalSessions?: number; // Defaults to 12
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  updatedAt?: Date;
}

