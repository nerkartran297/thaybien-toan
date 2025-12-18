"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Exam, ExamCategory } from "@/models/Exam";

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

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchExams();
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
      // TODO: Navigate to exam taking page
      // router.push(`/student/exams/${selectedExam._id}/take`);
      alert("Chức năng làm bài sẽ được triển khai sau");
      setShowDetailModal(false);
    }
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
            {filteredExams.map((exam) => (
              <div
                key={exam._id?.toString() || ""}
                onClick={() => handleExamClick(exam)}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3
                      className="text-lg font-bold mb-2"
                      style={{ color: colors.darkBrown }}
                    >
                      {exam.name}
                    </h3>
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
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedExam && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
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
            </div>

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
              <button
                onClick={handleStartExam}
                className="px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md hover:opacity-90"
                style={{
                  backgroundColor: colors.brown,
                }}
              >
                Bắt đầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

