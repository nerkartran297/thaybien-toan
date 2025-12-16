import { ObjectId } from 'mongodb';

export interface ScheduleSession {
  dayOfWeek: number; // 0-6 (0 = Sunday, 1 = Monday, etc.)
  timeSlot: string; // "17:30-19:00"
  classId?: ObjectId; // For group classes
}

export interface StudentEnrollment {
  _id?: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  frequency: 1 | 2; // sessions per week
  startDate: Date;
  endDate: Date; // Calculated: startDate + (frequency === 1 ? 18 : 9) weeks (default) or customWeeks (custom)
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'deferred';
  deferralWeeks?: number; // 1-4 weeks
  cycle?: number; // Chu kỳ đếm số buổi (ví dụ: 4, 6). Nếu không có, mặc định đếm 1-12
  paymentMode?: 'default' | 'custom'; // Chế độ tính tiền: default (9/18 tuần cho 12 buổi) hoặc custom (số tuần * tần suất)
  customWeeks?: number; // Số tuần cho custom mode (chỉ dùng khi paymentMode === 'custom')
  totalSessions?: number; // Tổng số buổi: 12 (default) hoặc customWeeks * frequency (custom)
  schedule: {
    sessions: ScheduleSession[];
  };
  completedSessions: number;
  remainingSessions: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateEnrollmentData {
  studentId: ObjectId | string;
  courseId: ObjectId | string;
  frequency: 1 | 2;
  startDate: Date | string;
  cycle?: number; // Chu kỳ đếm số buổi (ví dụ: 4, 6). Nếu không có, mặc định đếm 1-12
  paymentMode?: 'default' | 'custom'; // Chế độ tính tiền: default (9/18 tuần cho 12 buổi) hoặc custom (số tuần * tần suất)
  customWeeks?: number; // Số tuần cho custom mode (chỉ dùng khi paymentMode === 'custom')
  schedule: {
    sessions: ScheduleSession[];
  };
}

export interface UpdateEnrollmentData {
  frequency?: 1 | 2;
  startDate?: Date | string;
  schedule?: {
    sessions: ScheduleSession[];
  };
  status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'deferred';
  deferralWeeks?: number;
  cycle?: number; // Chu kỳ đếm số buổi (ví dụ: 4, 6). Nếu không có, mặc định đếm 1-12
  paymentMode?: 'default' | 'custom'; // Chế độ tính tiền: default (9/18 tuần cho 12 buổi) hoặc custom (số tuần * tần suất)
  customWeeks?: number; // Số tuần cho custom mode (chỉ dùng khi paymentMode === 'custom')
  completedSessions?: number;
  remainingSessions?: number;
  updatedAt?: Date;
}

