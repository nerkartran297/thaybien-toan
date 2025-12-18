"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Exam, ExamCategory, CreateExamData } from "@/models/Exam";
import { Class } from "@/models/Class";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

const CATEGORIES: ExamCategory[] = ["Đề giữa kỳ", "Đề cuối kỳ", "Đề luyện tập"];
const GRADES = [6, 7, 8, 9, 10, 11, 12];

export default function ExamsManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    file: null as File | null,
  });
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | "Tất cả">("Tất cả");
  const [selectedGrade, setSelectedGrade] = useState<number | "Tất cả">("Tất cả");
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedExamForShare, setSelectedExamForShare] = useState<Exam | null>(null);
  const [shareClasses, setShareClasses] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher") {
      fetchExams();
      fetchClasses();
    }
  }, [user]);

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/exams?role=teacher");
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

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes?isActive=true");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSelectAll = () => {
    const allSelected = classes.length > 0 && shareClasses.length === classes.length;
    if (allSelected) {
      // Bỏ chọn tất cả
      setShareClasses([]);
    } else {
      // Chọn tất cả
      setShareClasses(classes.map((cls) => cls._id?.toString() || "").filter((id) => id));
    }
  };

  const handleShareToggle = (classId: string) => {
    const newClasses = shareClasses.includes(classId)
      ? shareClasses.filter((id) => id !== classId)
      : [...shareClasses, classId];
    setShareClasses(newClasses);
  };

  const handleOpenShareModal = (exam: Exam) => {
    setSelectedExamForShare(exam);
    setShareClasses(
      exam.classes?.map((id) => (typeof id === "string" ? id : id.toString())) || []
    );
    setShowShareModal(true);
  };

  const handleSaveShare = async () => {
    if (!selectedExamForShare) return;

    try {
      const response = await fetch(`/api/exams/${selectedExamForShare._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classes: shareClasses }),
      });

      if (response.ok) {
        await fetchExams();
        setShowShareModal(false);
        setSelectedExamForShare(null);
        setShareClasses([]);
        alert("Chia sẻ đề thành công!");
      } else {
        alert("Có lỗi xảy ra khi chia sẻ đề");
      }
    } catch (error) {
      console.error("Error sharing exam:", error);
      alert("Có lỗi xảy ra khi chia sẻ đề");
    }
  };

  const handleUploadFile = async () => {
    if (!formData.file) {
      alert("Vui lòng chọn file để upload");
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.file);
      // Use fileName as default name, will be updated in create-answer page
      uploadFormData.append("name", formData.file.name.replace('.pdf', ''));
      uploadFormData.append("classes", JSON.stringify([])); // Default empty, share later
      uploadFormData.append("category", "Đề luyện tập"); // Default category, will be updated in create-answer page
      uploadFormData.append("timeLimit", "60"); // Default time limit, will be updated in create-answer page

      const response = await fetch("/api/exams", {
        method: "POST",
        body: uploadFormData,
      });

      if (response.ok) {
        const exam = await response.json();
        // Reset form
        setFormData({ file: null });
        setShowUploadModal(false);
        // Chuyển đến trang tạo đáp án
        router.push(`/teacher/exams/create-answer?id=${exam._id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Có lỗi xảy ra khi upload đề");
      }
    } catch (error) {
      console.error("Error uploading exam:", error);
      alert("Có lỗi xảy ra khi upload đề");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm("Bạn có chắc muốn xóa đề này?")) return;

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchExams();
        alert("Xóa đề thành công!");
      } else {
        alert("Có lỗi xảy ra khi xóa đề");
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Có lỗi xảy ra khi xóa đề");
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: colors.darkBrown }}
            >
              Quản Lý Đề
            </h1>
            <p className="text-lg" style={{ color: colors.brown }}>
              Upload và quản lý đề thi
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
            style={{
              backgroundColor: colors.mediumGreen,
            }}
          >
            + Thêm đề mới
          </button>
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
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    Khối {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exams list */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: colors.lightGreen }}>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Tên đề
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Phân loại
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Khối
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Thời gian
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Mô tả
                </th>
                <th
                  className="px-6 py-4 text-center text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {exams.length === 0
                      ? "Chưa có đề nào"
                      : "Không tìm thấy đề phù hợp"}
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr
                    key={exam._id?.toString() || ""}
                    className="border-b border-gray-200/80 hover:bg-gray-50"
                  >
                    <td
                      className="px-6 py-4 text-sm font-medium cursor-pointer hover:underline"
                      style={{ color: colors.darkBrown }}
                      onClick={() => router.push(`/teacher/exams/create-answer?id=${exam._id}`)}
                    >
                      {exam.name}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {exam.category}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {exam.grade ? `Khối ${exam.grade}` : "-"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {exam.timeLimit} phút
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {exam.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenShareModal(exam)}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: colors.mediumGreen,
                            color: "white",
                          }}
                        >
                          Chia sẻ
                        </button>
                        <button
                          onClick={() => handleDelete(exam._id?.toString() || "")}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: "#DC2626",
                            color: "white",
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div
            className="bg-white rounded-lg max-w-lg w-full mx-4 flex flex-col"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div className="p-6 flex-shrink-0 border-b" style={{ borderColor: colors.light }}>
              <div className="flex items-center justify-between">
                <h3
                  className="text-xl font-bold"
                  style={{ color: colors.darkBrown }}
                >
                  Thêm đề mới
                </h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setFormData({ file: null });
                  }}
                  className="text-2xl font-bold"
                  style={{ color: colors.brown }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.darkBrown }}
                  >
                    Upload file PDF *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: colors.brown,
                      color: colors.darkBrown,
                    }}
                    required
                  />
                  {formData.file && (
                    <p className="mt-2 text-sm" style={{ color: colors.brown }}>
                      Đã chọn: {formData.file.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div
                className="p-6 pt-4 border-t flex justify-end gap-2 flex-shrink-0"
                style={{ borderColor: colors.light }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setFormData({ file: null });
                  }}
                  className="px-4 py-2 rounded-lg transition-colors font-medium"
                  style={{
                    backgroundColor: colors.light,
                    color: colors.darkBrown,
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUploadFile}
                  disabled={uploading || !formData.file}
                  className="px-4 py-2 rounded-lg text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colors.mediumGreen,
                  }}
                >
                  {uploading ? "Đang upload..." : "Nhập đáp án"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedExamForShare && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div className="p-6 flex-shrink-0 border-b" style={{ borderColor: colors.light }}>
              <div className="flex items-center justify-between">
                <h3
                  className="text-xl font-bold"
                  style={{ color: colors.darkBrown }}
                >
                  Chia sẻ đề: {selectedExamForShare.name}
                </h3>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedExamForShare(null);
                    setShareClasses([]);
                  }}
                  className="text-2xl font-bold"
                  style={{ color: colors.brown }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-6 pb-4 overflow-y-auto flex-1">
              <p className="text-sm mb-4" style={{ color: colors.brown }}>
                Chọn các lớp được phép truy cập đề này:
              </p>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                {classes.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có lớp học nào</p>
                ) : (
                  <>
                    <label className="flex items-center space-x-2 cursor-pointer pb-2 border-b" style={{ borderColor: colors.light }}>
                      <input
                        type="checkbox"
                        checked={classes.length > 0 && shareClasses.length === classes.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                        style={{ accentColor: colors.mediumGreen }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: colors.darkBrown }}
                      >
                        Chọn tất cả
                      </span>
                    </label>
                    {classes.map((cls) => {
                    const classId = cls._id?.toString() || "";
                    return (
                      <label
                        key={classId}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={shareClasses.includes(classId)}
                          onChange={() => handleShareToggle(classId)}
                          className="w-4 h-4"
                          style={{ accentColor: colors.mediumGreen }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: colors.darkBrown }}
                        >
                          {cls.name}
                        </span>
                      </label>
                    );
                  })}
                  </>
                )}
              </div>
            </div>

            <div
              className="p-6 pt-4 border-t flex justify-end gap-2 flex-shrink-0"
              style={{ borderColor: colors.light }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedExamForShare(null);
                  setShareClasses([]);
                }}
                className="px-4 py-2 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: colors.light,
                  color: colors.darkBrown,
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveShare}
                className="px-4 py-2 rounded-lg text-white transition-colors font-medium"
                style={{
                  backgroundColor: colors.mediumGreen,
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

