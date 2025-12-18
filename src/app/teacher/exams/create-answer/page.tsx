"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Exam, ExamCategory, AnswerOption } from "@/models/Exam";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

const CATEGORIES: ExamCategory[] = ["Đề giữa kỳ", "Đề cuối kỳ", "Đề luyện tập"];
const GRADES = [6, 7, 8, 9, 10, 11, 12];
const ANSWER_OPTIONS: AnswerOption[] = ["A", "B", "C", "D"];

export default function CreateAnswerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("id");

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    grade: "",
    category: "Đề luyện tập" as ExamCategory,
    timeLimit: "",
  });

  // Answers state - array of AnswerOption | null
  const [answers, setAnswers] = useState<(AnswerOption | null)[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher" && examId) {
      fetchExam();
    }
  }, [user, examId]);

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (response.ok) {
        const data = await response.json();
        setExam(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          grade: data.grade?.toString() || "",
          category: data.category || "Đề luyện tập",
          timeLimit: data.timeLimit?.toString() || "",
        });
        // Initialize answers from existing data or empty array
        setAnswers(data.answers || []);
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      alert("Có lỗi xảy ra khi tải đề");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    // Add a new null answer for the new question
    setAnswers([...answers, null]);
  };

  const handleSelectAnswer = (questionIndex: number, answer: AnswerOption) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);

    // Auto-add next question button if this is the last question
    if (questionIndex === answers.length - 1) {
      // The next question button will appear automatically because answers array is updated
    }
  };

  const handleDeleteQuestion = (questionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers.splice(questionIndex, 1);
    setAnswers(newAnswers);
  };

  const handleSave = async () => {
    // Validation các trường bắt buộc
    if (!formData.name || formData.name.trim() === "") {
      alert("Vui lòng nhập tên đề");
      return;
    }

    if (!formData.grade || formData.grade.trim() === "") {
      alert("Vui lòng chọn khối");
      return;
    }

    if (!formData.category) {
      alert("Vui lòng chọn phân loại");
      return;
    }

    if (!formData.timeLimit || formData.timeLimit.trim() === "" || parseInt(formData.timeLimit) <= 0) {
      alert("Vui lòng nhập thời gian làm bài (phút)");
      return;
    }

    // Kiểm tra tất cả câu hỏi phải có đáp án
    if (answers.length === 0) {
      alert("Vui lòng tạo ít nhất một câu hỏi và chọn đáp án");
      return;
    }

    const unansweredQuestions = answers.findIndex((ans) => ans === null);
    if (unansweredQuestions !== -1) {
      alert(`Vui lòng chọn đáp án cho câu ${unansweredQuestions + 1}`);
      return;
    }

    // Tất cả answers đều có giá trị, không cần filter
    const validAnswers = answers.filter(
      (ans): ans is AnswerOption => ans !== null
    );

    setSaving(true);
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          grade: parseInt(formData.grade),
          category: formData.category,
          timeLimit: parseInt(formData.timeLimit),
          answers: validAnswers,
        }),
      });

      if (response.ok) {
        alert("Lưu đáp án thành công!");
        router.push("/teacher/exams");
      } else {
        const error = await response.json();
        alert(error.error || "Có lỗi xảy ra khi lưu đáp án");
      }
    } catch (error) {
      console.error("Error saving answers:", error);
      alert("Có lỗi xảy ra khi lưu đáp án");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || !exam) {
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

      <div className="max-w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: colors.darkBrown }}
          >
            Tạo Đáp Án Trắc Nghiệm
          </h1>
          <p className="text-lg" style={{ color: colors.brown }}>
            Nhập đáp án cho đề thi
          </p>
        </div>

        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Left column - Form */}
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
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Tên đề *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.brown,
                    color: colors.darkBrown,
                  }}
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.brown,
                    color: colors.darkBrown,
                  }}
                  rows={3}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Khối
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.brown,
                    color: colors.darkBrown,
                  }}
                >
                  <option value="">Chọn khối</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade.toString()}>
                      Khối {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Phân loại *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as ExamCategory,
                    })
                  }
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.brown,
                    color: colors.darkBrown,
                  }}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Thời gian làm bài (phút) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.timeLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, timeLimit: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.brown,
                    color: colors.darkBrown,
                  }}
                  required
                />
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

          {/* Right column - Answer Builder */}
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
              {/* Render questions */}
              {answers.map((answer, index) => (
                <div
                  key={index}
                  className="border-b pb-4 mb-4 relative"
                  style={{ borderColor: colors.light }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="text-lg font-semibold"
                      style={{ color: colors.darkBrown }}
                    >
                      Câu {index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(index)}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors text-lg leading-none"
                      style={{ color: "#DC2626" }}
                      title="Xóa câu này"
                    >
                      ×
                    </button>
                  </div>

                  {/* Answer options */}
                  <div className="flex gap-3 mb-3">
                    {ANSWER_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelectAnswer(index, option)}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
                          answer === option
                            ? "bg-black text-white border-black"
                            : "bg-white border-gray-300 hover:border-gray-400"
                        }`}
                        style={{
                          color: answer === option ? "white" : colors.darkBrown,
                          borderColor:
                            answer === option
                              ? "black"
                              : colors.brown + "40",
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {/* Next question button appears after selecting an answer */}
                  {answer !== null &&
                    index === answers.length - 1 &&
                    index < 100 && (
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full py-2 px-4 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: colors.lightGreen,
                          color: colors.darkBrown,
                        }}
                      >
                        + Câu {index + 2}
                      </button>
                    )}
                </div>
              ))}

              {/* Initial button if no questions yet */}
              {answers.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: colors.lightGreen,
                    color: colors.darkBrown,
                  }}
                >
                  + Câu 1
                </button>
              )}
              </div>
            </div>

            {/* Save button - Fixed at bottom */}
            <div className="p-6 pt-4 border-t flex-shrink-0" style={{ borderColor: colors.light }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.brown,
                }}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

