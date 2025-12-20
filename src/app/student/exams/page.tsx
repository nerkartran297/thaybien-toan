"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Exam, ExamCategory } from "@/models/Exam";
import { ExamAttempt } from "@/models/ExamAttempt";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

const CATEGORIES: ExamCategory[] = ["Đề giữa kỳ", "Đề cuối kỳ", "Đề luyện tập"];

export default function StudentExamsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | "Tất cả">("Tất cả");
  const [selectedGrade, setSelectedGrade] = useState<number | "Tất cả">("Tất cả");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchExams();
      fetchExamAttempts();
    }
  }, [user]);

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/exams?role=student");
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamAttempts = async () => {
    try {
      const response = await fetch("/api/exam-attempts");
      if (response.ok) {
        const data = await response.json();
        setExamAttempts(data);
      }
    } catch (error) {
      console.error("Error fetching exam attempts:", error);
    }
  };

  const filteredExams = exams.filter((exam) => {
    if (selectedCategory !== "Tất cả" && exam.category !== selectedCategory) {
      return false;
    }
    if (selectedGrade !== "Tất cả" && exam.grade !== selectedGrade) {
      return false;
    }
    return true;
  });

  const handleExamClick = (exam: Exam) => {
    setSelectedExam(exam);
    setShowDetailModal(true);
  };

  const handleStartExam = () => {
    if (selectedExam) {
      // Show confirmation modal for first time attempt
      setShowConfirmModal(true);
    }
  };

  const handleConfirmStartExam = () => {
    if (selectedExam) {
      router.push(`/student/exams/${selectedExam._id}/take`);
      setShowDetailModal(false);
      setShowConfirmModal(false);
    }
  };

  const handleRetakeExam = () => {
    if (selectedExam) {
      router.push(`/student/exams/${selectedExam._id}/take?retake=true`);
      setShowDetailModal(false);
    }
  };

  const handleViewResult = () => {
    if (selectedExam) {
      const examIdStr = selectedExam._id?.toString();
      const examAttempt = examAttempts.find(
        (attempt) => {
          const attemptExamIdStr = typeof attempt.examId === 'string' ? attempt.examId : attempt.examId?.toString();
          return attemptExamIdStr === examIdStr && attempt.submittedAt;
        }
      );
      if (examAttempt) {
        router.push(`/student/exams/${selectedExam._id}/review?attemptId=${examAttempt._id}`);
      }
      setShowDetailModal(false);
    }
  };

  const getExamStatus = (examId: string | undefined) => {
    if (!examId) return null;
    const attempt = examAttempts.find(
      (a) => {
        const attemptExamIdStr = typeof a.examId === 'string' ? a.examId : a.examId?.toString();
        return attemptExamIdStr === examId && a.submittedAt;
      }
    );
    return attempt ? { submitted: true, score: attempt.score, total: attempt.totalQuestions } : null;
  };

  if (authLoading || loading) {
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: colors.darkBrown }}
          >
            Luyện Đề
          </h1>
          <p className="text-lg" style={{ color: colors.brown }}>
            Luyện tập với các đề thi
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.darkBrown }}
              >
                Phân loại
              </label>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value as ExamCategory | "Tất cả"
                  )
                }
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: colors.brown,
                  color: colors.darkBrown,
                }}
              >
                <option value="Tất cả">Tất cả</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.darkBrown }}
              >
                Khối
              </label>
              <select
                value={selectedGrade}
                onChange={(e) =>
                  setSelectedGrade(
                    e.target.value === "Tất cả"
                      ? "Tất cả"
                      : parseInt(e.target.value)
                  )
                }
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: colors.brown,
                  color: colors.darkBrown,
                }}
              >
                <option value="Tất cả">Tất cả</option>
                {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <option key={grade} value={grade}>
                    Khối {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exams grid */}
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-lg" style={{ color: colors.brown }}>
              {exams.length === 0
                ? "Chưa có đề nào"
                : "Không tìm thấy đề phù hợp"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => {
              const status = getExamStatus(exam._id?.toString());
              const hasSubmitted = status !== null;
              
              return (
                <div
                  key={exam._id?.toString() || ""}
                  onClick={() => handleExamClick(exam)}
                  className="rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                  style={{
                    backgroundColor: hasSubmitted ? "#fffff5" : "white",
                  }}
                >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3
                        className="text-lg font-bold flex-1"
                        style={{ color: colors.darkBrown }}
                      >
                        {exam.name}
                      </h3>
                      {hasSubmitted && (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                          style={{
                            backgroundColor: colors.lightGreen,
                            color: colors.darkBrown,
                          }}
                        >
                          Đã làm
                        </span>
                      )}
                      {status && status.score !== undefined && (
                        <div
                          className="px-3 py-1 rounded-lg font-bold text-white flex-shrink-0"
                          style={{
                            backgroundColor: status.score >= status.total * 0.7 ? "#10B981" : status.score >= status.total * 0.5 ? "#F59E0B" : "#DC2626",
                          }}
                        >
                          {status.score}/{status.total}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: colors.lightGreen,
                          color: colors.darkBrown,
                        }}
                      >
                        {exam.category}
                      </span>
                      {exam.grade && (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: colors.light,
                            color: colors.brown,
                          }}
                        >
                          Khối {exam.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {exam.description && (
                  <p
                    className="text-sm mb-4 line-clamp-2"
                    style={{ color: colors.brown }}
                  >
                    {exam.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ color: colors.brown }}
                  >
                    Thời gian: {exam.timeLimit} phút
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: colors.mediumGreen }}
                  >
                    Xem chi tiết →
                  </span>
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedExam && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-6"
            style={{
              borderColor: colors.brown,
              borderWidth: "2px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b"
              style={{ borderColor: colors.light }}
            >
              <h2
                className="text-2xl font-bold"
                style={{ color: colors.darkBrown }}
              >
                {selectedExam.name}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                style={{ fontSize: "24px", lineHeight: "1" }}
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: colors.brown }}
                >
                  Phân loại
                </div>
                <div
                  className="text-base font-medium"
                  style={{ color: colors.darkBrown }}
                >
                  {selectedExam.category}
                </div>
              </div>

              {selectedExam.grade && (
                <div>
                  <div
                    className="text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: colors.brown }}
                  >
                    Khối
                  </div>
                  <div
                    className="text-base font-medium"
                    style={{ color: colors.darkBrown }}
                  >
                    Khối {selectedExam.grade}
                  </div>
                </div>
              )}

              <div>
                <div
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: colors.brown }}
                >
                  Thời gian làm bài
                </div>
                <div
                  className="text-base font-medium"
                  style={{ color: colors.darkBrown }}
                >
                  {selectedExam.timeLimit} phút
                </div>
              </div>

              {selectedExam.description && (
                <div>
                  <div
                    className="text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: colors.brown }}
                  >
                    Mô tả
                  </div>
                  <div
                    className="text-base"
                    style={{ color: colors.darkBrown }}
                  >
                    {selectedExam.description}
                  </div>
                </div>
              )}

              {selectedExam.note && (
                <div>
                  <div
                    className="text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: colors.brown }}
                  >
                    Ghi chú
                  </div>
                  <div
                    className="text-base"
                    style={{ color: colors.darkBrown }}
                  >
                    {selectedExam.note}
                  </div>
                </div>
              )}

              {(() => {
                const status = getExamStatus(selectedExam._id?.toString());
                return status ? (
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-wide mb-1"
                      style={{ color: colors.brown }}
                    >
                      Kết quả đã làm
                    </div>
                    <div
                      className="text-base font-medium"
                      style={{ color: colors.darkBrown }}
                    >
                      Điểm: {status.score ?? 0}/{status.total} ({((status.score ?? 0) / status.total * 10).toFixed(1)}/10)
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {(() => {
              const status = getExamStatus(selectedExam._id?.toString());
              const hasSubmitted = status !== null;

              return (
                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-5 py-2.5 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{
                      backgroundColor: colors.light,
                      color: colors.darkBrown,
                    }}
                  >
                    Hủy
                  </button>
                  {hasSubmitted ? (
                    <>
                      <button
                        onClick={handleViewResult}
                        className="px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md hover:opacity-90"
                        style={{
                          backgroundColor: colors.mediumGreen,
                        }}
                      >
                        Xem lại bài đã làm
                      </button>
                      <button
                        onClick={handleRetakeExam}
                        className="px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md hover:opacity-90"
                        style={{
                          backgroundColor: colors.brown,
                        }}
                      >
                        Làm lại
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleStartExam}
                      className="px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md hover:opacity-90"
                      style={{
                        backgroundColor: colors.brown,
                      }}
                    >
                      Bắt đầu
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Confirmation Modal for First Time Attempt */}
      {showConfirmModal && selectedExam && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
            style={{
              borderColor: colors.brown,
              borderWidth: "2px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: colors.darkBrown }}
              >
                ⚠️ Xác nhận bắt đầu làm đề
              </h3>
              <div className="space-y-3">
                <p className="text-base" style={{ color: colors.darkBrown }}>
                  Bạn sắp bắt đầu làm đề thi: <strong>{selectedExam.name}</strong>
                </p>
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: "#FEF3C7", borderLeft: "4px solid #F59E0B" }}
                >
                  <p className="text-sm font-semibold mb-2" style={{ color: "#92400E" }}>
                    ⚠️ Lưu ý quan trọng:
                  </p>
                  <ul className="text-sm space-y-1" style={{ color: "#78350F" }}>
                    <li>• Chỉ kết quả lần làm đầu tiên mới được lưu lại</li>
                    <li>• Nếu bạn bấm nhầm và thoát ra, bạn sẽ mất cơ hội làm đề này</li>
                    <li>• Thời gian làm bài: <strong>{selectedExam.timeLimit} phút</strong></li>
                    <li>• Hãy đảm bảo bạn đã sẵn sàng trước khi bắt đầu</li>
                  </ul>
                </div>
                <p className="text-sm font-medium" style={{ color: colors.brown }}>
                  Bạn có chắc chắn muốn bắt đầu làm đề thi này không?
                </p>
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-lg font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: colors.light,
                  color: colors.darkBrown,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmStartExam}
                className="px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md hover:opacity-90"
                style={{
                  backgroundColor: colors.brown,
                }}
              >
                Xác nhận bắt đầu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

