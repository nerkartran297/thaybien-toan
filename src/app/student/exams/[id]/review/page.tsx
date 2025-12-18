"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Exam, AnswerOption } from "@/models/Exam";
import { ExamAttempt } from "@/models/ExamAttempt";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

const ANSWER_OPTIONS: AnswerOption[] = ["A", "B", "C", "D"];

export default function ReviewExamPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id as string;
  const attemptId = searchParams.get("attemptId");

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student" && examId && attemptId) {
      fetchData();
    }
  }, [user, examId, attemptId]);

  const fetchData = async () => {
    try {
      // Fetch exam details
      const examResponse = await fetch(`/api/exams/${examId}`);
      if (!examResponse.ok) {
        alert("Không tìm thấy đề thi");
        router.push("/student/exams");
        return;
      }
      const examData = await examResponse.json();
      setExam(examData);

      // Fetch attempt details
      const attemptResponse = await fetch(`/api/exam-attempts/${attemptId}`);
      if (!attemptResponse.ok) {
        alert("Không tìm thấy bài làm");
        router.push("/student/exams");
        return;
      }
      const attemptData = await attemptResponse.json();
      setAttempt(attemptData);

      if (attemptData.examId !== examId) {
        alert("Bài làm không khớp với đề thi");
        router.push("/student/exams");
        return;
      }

      if (!attemptData.submittedAt) {
        alert("Bài làm chưa được nộp");
        router.push("/student/exams");
        return;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Có lỗi xảy ra khi tải dữ liệu");
      router.push("/student/exams");
    } finally {
      setLoading(false);
    }
  };

  const getAnswerStatus = (questionIndex: number) => {
    if (!exam || !attempt || !exam.answers) return null;

    const correctAnswer = exam.answers[questionIndex];
    const studentAnswer = attempt.answers[questionIndex] || null;

    if (!studentAnswer) {
      return { isCorrect: false, isAnswered: false, correctAnswer, studentAnswer: null };
    }

    return {
      isCorrect: studentAnswer === correctAnswer,
      isAnswered: true,
      correctAnswer,
      studentAnswer,
    };
  };

  if (authLoading || loading || !exam || !attempt || !attempt.submittedAt) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.light }}
      >
        <div className="text-lg" style={{ color: colors.darkBrown }}>
          Đang tải...
        </div>
      </div>
    );
  }

  const totalQuestions = exam.answers?.length || 0;
  const score = attempt.score || 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      <Navigation />

      <div className="max-w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: colors.darkBrown }}
          >
            Xem lại bài làm: {exam.name}
          </h1>
        </div>

        {/* Result Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6" style={{ borderColor: colors.brown, borderWidth: "2px" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.darkBrown }}>
                Kết quả
              </h2>
              <div className="text-3xl font-bold" style={{ color: colors.brown }}>
                {score}/{totalQuestions} điểm
              </div>
              <div className="text-lg mt-1" style={{ color: colors.darkBrown }}>
                Điểm số: {((score / totalQuestions) * 10).toFixed(2)}/10
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm" style={{ color: colors.brown }}>
                Thời gian làm: {attempt.timeSpent || 0} phút
              </div>
              <div className="text-sm" style={{ color: colors.brown }}>
                Nộp lúc: {new Date(attempt.submittedAt).toLocaleString("vi-VN")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 h-[calc(100vh-350px)]">
          {/* Left column - Exam Info */}
          <div
            className="w-80 bg-white rounded-lg shadow-lg p-6 overflow-y-auto flex-shrink-0"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: colors.darkBrown }}
            >
              Thông tin đề
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Tên đề
                </label>
                <div className="text-base" style={{ color: colors.brown }}>
                  {exam.name}
                </div>
              </div>

              {exam.description && (
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Mô tả
                  </label>
                  <div className="text-sm" style={{ color: colors.brown }}>
                    {exam.description}
                  </div>
                </div>
              )}

              {exam.grade && (
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Khối
                  </label>
                  <div className="text-base" style={{ color: colors.brown }}>
                    Khối {exam.grade}
                  </div>
                </div>
              )}

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Phân loại
                </label>
                <div className="text-base" style={{ color: colors.brown }}>
                  {exam.category}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Tổng số câu
                </label>
                <div className="text-base" style={{ color: colors.brown }}>
                  {totalQuestions} câu
                </div>
              </div>
            </div>
          </div>

          {/* Middle column - PDF Viewer */}
          <div
            className="flex-1 bg-white rounded-lg shadow-lg p-4 overflow-hidden flex flex-col"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: colors.darkBrown }}
            >
              Đề thi
            </h2>
            <div className="flex-1 overflow-auto">
              {exam.filePath && (
                <iframe
                  src={exam.filePath}
                  className="w-full h-full border-0"
                  style={{ minHeight: "600px" }}
                />
              )}
            </div>
          </div>

          {/* Right column - Answers Review */}
          <div
            className="w-96 bg-white rounded-lg shadow-lg flex flex-col flex-shrink-0"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div className="p-6 flex-shrink-0 border-b" style={{ borderColor: colors.light }}>
              <h2
                className="text-xl font-bold"
                style={{ color: colors.darkBrown }}
              >
                Đáp án
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {Array.from({ length: totalQuestions }).map((_, index) => {
                  const status = getAnswerStatus(index);
                  if (!status) return null;

                  const { isCorrect, isAnswered, correctAnswer, studentAnswer } = status;

                  return (
                    <div
                      key={index}
                      className="border-b pb-4 mb-4"
                      style={{ borderColor: colors.light }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="text-lg font-semibold"
                          style={{ color: colors.darkBrown }}
                        >
                          Câu {index + 1}
                        </div>
                        {isCorrect ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            Đúng
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            {isAnswered ? "Sai" : "Chưa trả lời"}
                          </span>
                        )}
                      </div>

                      {/* Answer options */}
                      <div className="space-y-2">
                        {ANSWER_OPTIONS.map((option) => {
                          const isCorrectOption = option === correctAnswer;
                          const isStudentAnswer = option === studentAnswer;
                          let bgColor = "bg-white";
                          let borderColor = colors.brown + "40";
                          let textColor = colors.darkBrown;

                          if (isCorrectOption) {
                            bgColor = "bg-green-100";
                            borderColor = "#10B981";
                            textColor = "#065F46";
                          }
                          if (isStudentAnswer && !isCorrect) {
                            bgColor = "bg-red-100";
                            borderColor = "#DC2626";
                            textColor = "#991B1B";
                          }

                          return (
                            <div
                              key={option}
                              className={`w-full py-2 px-3 rounded border-2 flex items-center justify-between ${bgColor}`}
                              style={{ borderColor, color: textColor }}
                            >
                              <span className="font-semibold">{option}</span>
                              {isCorrectOption && (
                                <span className="text-xs font-medium">✓ Đáp án đúng</span>
                              )}
                              {isStudentAnswer && !isCorrectOption && (
                                <span className="text-xs font-medium">✗ Bạn chọn</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Back button - Fixed at bottom */}
            <div className="p-6 pt-4 border-t flex-shrink-0" style={{ borderColor: colors.light }}>
              <button
                type="button"
                onClick={() => router.push("/student/exams")}
                className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors"
                style={{
                  backgroundColor: colors.brown,
                }}
              >
                Quay lại danh sách đề
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

