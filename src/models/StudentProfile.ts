import { ObjectId } from 'mongodb';

/**
 * Student Profile Model
 * Lưu thông tin học tập và điểm tích lũy của học sinh
 */
export interface StudentProfile {
  _id?: ObjectId;
  userId: ObjectId; // Reference đến users._id
  lifetimeScore: number; // Điểm tổng trọn đời, không reset, dùng để tính level (mặc định: 0)
  seasonalScores: number[]; // Mảng điểm theo mùa [mùa1, mùa2, mùa3, ...], mùa hiện tại là phần tử cuối
  currentSeason: number; // Số mùa hiện tại (bắt đầu từ 1), dùng để track mùa
  gold?: number; // Tiền vàng để mua vật phẩm (mặc định: 0)
  // Deprecated fields (giữ lại để tương thích)
  competitionScore?: number; // Điểm cũ, sẽ migrate sang lifetimeScore
  monthly_scores?: {
    // Object lưu điểm theo tháng, key: "YYYY-MM" (deprecated)
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
  lifetimeScore?: number; // Mặc định: 0
  seasonalScores?: number[]; // Mặc định: [0]
  currentSeason?: number; // Mặc định: 1
  gold?: number; // Mặc định: 0
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

