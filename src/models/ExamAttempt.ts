import { ObjectId } from 'mongodb';
import { AnswerOption } from './Exam';

export interface ExamAttempt {
  _id?: ObjectId;
  examId: ObjectId; // ID của đề thi
  studentId: ObjectId; // ID của học sinh làm bài
  roomId?: ObjectId; // ID của room (for synchronized exams)
  answers: (AnswerOption | null)[]; // Đáp án học sinh chọn (có thể null nếu chưa chọn)
  score?: number; // Điểm số (tổng số câu đúng)
  totalQuestions: number; // Tổng số câu hỏi
  startedAt: Date; // Thời gian bắt đầu làm bài
  submittedAt?: Date; // Thời gian nộp bài
  timeSpent?: number; // Thời gian làm bài (phút)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateExamAttemptData {
  examId: string;
  studentId?: string; // Optional, will use authenticated user
  roomId?: string; // Optional, for synchronized exams
  answers?: (AnswerOption | null)[];
  startedAt: Date | string;
}

export interface SubmitExamAttemptData {
  answers: (AnswerOption | null)[];
  submittedAt: Date;
  timeSpent: number;
}

