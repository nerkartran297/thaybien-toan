import { ObjectId } from 'mongodb';

export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export interface QuizQuestion {
  question: string; // Nội dung câu hỏi
  imageUrl?: string; // URL hình ảnh (nếu có) - hiển thị phía dưới text
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: AnswerOption; // Đáp án đúng
  timeLimit: number; // Thời gian làm bài (giây)
  explanation?: string; // Giải thích đáp án (cho giáo viên)
}

export interface Quiz {
  _id?: ObjectId;
  name: string; // Tên quiz
  description?: string; // Mô tả
  questions: QuizQuestion[]; // Danh sách câu hỏi
  createdBy?: ObjectId; // ID giáo viên tạo
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateQuizData {
  name: string;
  description?: string;
  questions: QuizQuestion[];
}

export interface UpdateQuizData {
  name?: string;
  description?: string;
  questions?: QuizQuestion[];
}

