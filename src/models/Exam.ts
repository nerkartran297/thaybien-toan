import { ObjectId } from 'mongodb';

export type ExamCategory = 'Đề giữa kỳ' | 'Đề cuối kỳ' | 'Đề luyện tập';
export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export interface Exam {
  _id?: ObjectId;
  name: string;
  description?: string; // Mô tả chi tiết về đề
  filePath: string; // Đường dẫn file PDF đề thi
  fileName: string; // Tên file gốc
  classes: ObjectId[]; // Array of class IDs that can access this exam
  grade?: number; // Khối (6-12)
  category: ExamCategory; // Phân loại
  timeLimit: number; // Thời gian làm bài (phút)
  note?: string; // Ghi chú
  answers?: AnswerOption[]; // Mảng đáp án trắc nghiệm (A, B, C, hoặc D)
  createdBy?: ObjectId; // ID của giáo viên tạo
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateExamData {
  name: string;
  description?: string;
  filePath: string;
  fileName: string;
  classes: string[]; // Array of class IDs as strings
  grade?: number;
  category: ExamCategory;
  timeLimit: number;
  note?: string;
  answers?: AnswerOption[];
}

export interface UpdateExamData {
  name?: string;
  description?: string;
  classes?: string[]; // Array of class IDs as strings
  grade?: number;
  category?: ExamCategory;
  timeLimit?: number;
  note?: string;
  answers?: AnswerOption[];
  updatedAt?: Date;
}

