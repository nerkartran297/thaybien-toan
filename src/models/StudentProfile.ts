import { ObjectId } from 'mongodb';

/**
 * Student Profile Model
 * Lưu thông tin học tập và điểm tích lũy của học sinh
 */
export interface StudentProfile {
  _id?: ObjectId;
  userId: ObjectId; // Reference đến users._id
  competitionScore: number; // Điểm tích lũy tổng (mặc định: 0)
  monthly_scores?: {
    // Object lưu điểm theo tháng, key: "YYYY-MM"
    [monthKey: string]: number;
  };
  grade?: number | null; // Khối lớp (6-12)
  group?: string | null; // Nhóm/lớp (ví dụ: "5A", "6B")
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE'; // Trạng thái
  notes?: string | null; // Ghi chú của giáo viên
  dateOfBirth?: Date | null; // Ngày sinh
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateStudentProfileData {
  userId: ObjectId | string;
  competitionScore?: number; // Mặc định: 0
  grade?: number | null;
  group?: string | null;
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  notes?: string | null;
  dateOfBirth?: Date | string | null;
}

export interface UpdateStudentProfileData extends Partial<CreateStudentProfileData> {
  updatedAt?: Date;
}

/**
 * Competition Points Record
 * Ghi lại việc cộng điểm từ mỗi room để tránh trùng lặp
 */
export interface CompetitionPointsRecord {
  _id?: ObjectId;
  roomId: ObjectId; // ID của room
  studentId: ObjectId; // ID của student_profiles._id (KHÔNG phải userId)
  points: number; // Số điểm được cộng
  rank: number; // Thứ hạng trong room
  addedAt: Date; // Thời gian cộng điểm
}

