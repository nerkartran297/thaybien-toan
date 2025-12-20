import { ObjectId } from 'mongodb';
import { AnswerOption } from './Quiz';

export interface QuizSession {
  _id?: ObjectId;
  roomId: ObjectId; // ID của room
  quizId: ObjectId; // ID của quiz
  currentQuestionIndex: number; // Câu hỏi hiện tại (0-based)
  isQuestionActive: boolean; // Câu hỏi đang active (học sinh có thể trả lời)
  questionStartTime?: Date; // Thời gian bắt đầu câu hỏi hiện tại
  isCompleted: boolean; // Quiz đã hoàn thành
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuizAnswer {
  _id?: ObjectId;
  sessionId: ObjectId; // ID của QuizSession
  roomId: ObjectId; // ID của room
  studentId: ObjectId; // ID của học sinh
  questionIndex: number; // Số thứ tự câu hỏi (0-based)
  answer: AnswerOption; // Đáp án học sinh chọn
  isCorrect: boolean; // Đáp án đúng hay sai
  timeSpent: number; // Thời gian trả lời (giây) - tính từ khi questionStartTime
  score: number; // Điểm cho câu này (dựa trên đúng/sai và tốc độ)
  answeredAt: Date; // Thời gian trả lời
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuizStudentScore {
  _id?: ObjectId;
  sessionId: ObjectId; // ID của QuizSession
  roomId: ObjectId; // ID của room
  studentId: ObjectId; // ID của học sinh
  totalScore: number; // Tổng điểm
  correctAnswers: number; // Số câu đúng
  totalQuestions: number; // Tổng số câu hỏi
  averageTimeSpent: number; // Thời gian trung bình (giây)
  createdAt?: Date;
  updatedAt?: Date;
}

