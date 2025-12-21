"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Quiz, QuizQuestion, AnswerOption } from "@/models/Quiz";

export default function TeacherQuizzesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    questions: [] as QuizQuestion[],
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher") {
      fetchQuizzes();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/quizzes");
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.questions.length === 0) {
      alert("Vui lòng thêm ít nhất 1 câu hỏi");
      return;
    }

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: "",
          description: "",
          questions: [],
        });
        fetchQuizzes();
        alert("Tạo quiz thành công!");
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    }
  };

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;

    if (formData.questions.length === 0) {
      alert("Vui lòng thêm ít nhất 1 câu hỏi");
      return;
    }

    try {
      const response = await fetch(`/api/quizzes/${editingQuiz._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setEditingQuiz(null);
        setFormData({
          name: "",
          description: "",
          questions: [],
        });
        fetchQuizzes();
        alert("Cập nhật quiz thành công!");
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Bạn có chắc muốn xóa quiz này?")) return;

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchQuizzes();
        alert("Xóa quiz thành công!");
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      name: quiz.name,
      description: quiz.description || "",
      questions: quiz.questions || [],
    });
    setShowCreateForm(true);
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: "",
          imageUrl: "",
          options: { A: "", B: "", C: "", D: "" },
          correctAnswer: "A",
          timeLimit: 30,
        },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  const updateQuestion = (index: number, field: string, value: unknown) => {
    const updatedQuestions = [...formData.questions];
    if (field === "options") {
      updatedQuestions[index].options = { ...updatedQuestions[index].options, ...(value as unknown as Record<string, string>) };
    } else {
      (updatedQuestions[index] as unknown as Record<string, unknown>)[field] = value;
    }
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]">
        <div className="text-[#2c3e50]">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2c3e50] mb-4">
            Quản Lý Quiz
          </h1>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingQuiz(null);
              if (!showCreateForm) {
                setFormData({
                  name: "",
                  description: "",
                  questions: [],
                });
              }
            }}
            className="bg-[#ADC178] text-[#2c3e50] px-6 py-2 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-semibold"
          >
            {showCreateForm ? "Hủy" : "Tạo Quiz Mới"}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-[#ADC178]">
            <h2 className="text-xl font-bold mb-4 text-[#2c3e50]">
              {editingQuiz ? "Chỉnh Sửa Quiz" : "Tạo Quiz Mới"}
            </h2>
            <form
              onSubmit={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                  Tên Quiz *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
                  placeholder="Quiz Toán Học"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
                  rows={3}
                  placeholder="Mô tả về quiz này..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[#2c3e50]">
                    Câu Hỏi *
                  </label>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-[#ADC178] text-[#2c3e50] px-4 py-1 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors text-sm font-semibold"
                  >
                    + Thêm Câu Hỏi
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.questions.map((question, index) => (
                    <div
                      key={index}
                      className="border border-[#ADC178] rounded-lg p-4 bg-[#F0EAD2]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-[#2c3e50]">
                          Câu {index + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          Xóa
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                            Nội dung câu hỏi *
                          </label>
                          <textarea
                            value={question.question}
                            onChange={(e) =>
                              updateQuestion(index, "question", e.target.value)
                            }
                            required
                            className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
                            rows={2}
                            placeholder="Nhập câu hỏi..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                            Hình ảnh (Tùy chọn)
                          </label>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Validate file size (max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert("Kích thước file phải nhỏ hơn 5MB");
                                    e.target.value = "";
                                    return;
                                  }

                                  // Upload file
                                  const uploadFormData = new FormData();
                                  uploadFormData.append("file", file);

                                  try {
                                    const response = await fetch("/api/quiz-images/upload", {
                                      method: "POST",
                                      body: uploadFormData,
                                    });

                                    if (response.ok) {
                                      const data = await response.json();
                                      updateQuestion(index, "imageUrl", data.imageUrl);
                                    } else {
                                      const error = await response.json();
                                      alert(error.error || "Lỗi khi upload hình ảnh");
                                      e.target.value = "";
                                    }
                                  } catch (error) {
                                    console.error("Error uploading image:", error);
                                    alert("Lỗi khi upload hình ảnh");
                                    e.target.value = "";
                                  }
                                }
                              }}
                              className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
                            />
                            {question.imageUrl && (
                              <div className="mt-2 space-y-2">
                                <img
                                  src={question.imageUrl}
                                  alt="Preview"
                                  className="max-w-full h-auto max-h-48 rounded-lg border border-[#ADC178]"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuestion(index, "imageUrl", "")}
                                  className="text-sm text-red-600 hover:text-red-800 font-semibold"
                                >
                                  Xóa hình ảnh
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {(["A", "B", "C", "D"] as AnswerOption[]).map(
                            (option) => (
                              <div key={option}>
                                <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                                  Đáp án {option} *
                                </label>
                                <input
                                  type="text"
                                  value={question.options[option]}
                                  onChange={(e) =>
                                    updateQuestion(index, "options", {
                                      [option]: e.target.value,
                                    })
                                  }
                                  required
                                  className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
                                  placeholder={`Đáp án ${option}`}
                                />
                              </div>
                            )
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                              Đáp án đúng *
                            </label>
                            <select
                              value={question.correctAnswer}
                              onChange={(e) =>
                                updateQuestion(
                                  index,
                                  "correctAnswer",
                                  e.target.value as AnswerOption
                                )
                              }
                              required
                              className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                              Thời gian (giây) *
                            </label>
                            <input
                              type="number"
                              min="5"
                              max="300"
                              value={question.timeLimit}
                              onChange={(e) =>
                                updateQuestion(
                                  index,
                                  "timeLimit",
                                  parseInt(e.target.value) || 30
                                )
                              }
                              required
                              className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.questions.length === 0 && (
                  <p className="text-sm text-[#6C584C] italic">
                    Chưa có câu hỏi nào. Hãy thêm câu hỏi để tạo quiz.
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-[#ADC178] text-[#2c3e50] px-6 py-2 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-semibold"
                >
                  {editingQuiz ? "Cập Nhật" : "Tạo Quiz"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingQuiz(null);
                    setFormData({
                      name: "",
                      description: "",
                      questions: [],
                    });
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178]">
          <h2 className="text-2xl font-bold mb-4 text-[#2c3e50]">
            Danh Sách Quiz
          </h2>
          {quizzes.length === 0 ? (
            <p className="text-[#6C584C]">Chưa có quiz nào.</p>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id?.toString()}
                  className="border border-[#ADC178] rounded-lg p-4 bg-[#F0EAD2]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#2c3e50] mb-1">
                        {quiz.name}
                      </h3>
                      {quiz.description && (
                        <p className="text-sm text-[#6C584C] mb-2">
                          {quiz.description}
                        </p>
                      )}
                      <p className="text-sm text-[#6C584C]">
                        Số câu hỏi: {quiz.questions?.length || 0} câu
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditQuiz(quiz)}
                        className="bg-[#ADC178] text-[#2c3e50] px-4 py-2 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-semibold text-sm"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id?.toString() || "")}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

