"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Document, DocumentCategory, CreateDocumentData } from "@/models/Document";
import { Class } from "@/models/Class";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

const CATEGORIES: DocumentCategory[] = ["Bài tập", "Đề giữa kỳ", "Đề cuối kỳ"];
const GRADES = [6, 7, 8, 9, 10, 11, 12];

export default function DocumentsManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    file: null as File | null,
    grade: "",
    note: "",
    category: "Bài tập" as DocumentCategory,
  });
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "Tất cả">("Tất cả");
  const [selectedGrade, setSelectedGrade] = useState<number | "Tất cả">("Tất cả");
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState<Document | null>(null);
  const [shareClasses, setShareClasses] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher") {
      fetchDocuments();
      fetchClasses();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents?role=teacher");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
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

  const handleOpenShareModal = (doc: Document) => {
    setSelectedDocForShare(doc);
    setShareClasses(
      doc.classes?.map((id) => (typeof id === "string" ? id : id.toString())) || []
    );
    setShowShareModal(true);
  };

  const handleSaveShare = async () => {
    if (!selectedDocForShare) return;

    try {
      const response = await fetch(`/api/documents/${selectedDocForShare._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classes: shareClasses }),
      });

      if (response.ok) {
        await fetchDocuments();
        setShowShareModal(false);
        setSelectedDocForShare(null);
        setShareClasses([]);
        alert("Chia sẻ tài liệu thành công!");
      } else {
        alert("Có lỗi xảy ra khi chia sẻ tài liệu");
      }
    } catch (error) {
      console.error("Error sharing document:", error);
      alert("Có lỗi xảy ra khi chia sẻ tài liệu");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.file || !formData.name || !formData.category) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.file);
      uploadFormData.append("name", formData.name);
      uploadFormData.append("classes", JSON.stringify([])); // Default empty, share later
      if (formData.grade) {
        uploadFormData.append("grade", formData.grade);
      }
      if (formData.note) {
        uploadFormData.append("note", formData.note);
      }
      uploadFormData.append("category", formData.category);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: uploadFormData,
      });

      if (response.ok) {
        await fetchDocuments();
        setShowUploadModal(false);
        setFormData({
          name: "",
          file: null,
          grade: "",
          note: "",
          category: "Bài tập",
        });
        alert("Upload tài liệu thành công!");
      } else {
        const error = await response.json();
        alert(error.error || "Có lỗi xảy ra khi upload tài liệu");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Có lỗi xảy ra khi upload tài liệu");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Bạn có chắc muốn xóa tài liệu này?")) return;

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchDocuments();
        alert("Xóa tài liệu thành công!");
      } else {
        alert("Có lỗi xảy ra khi xóa tài liệu");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Có lỗi xảy ra khi xóa tài liệu");
    }
  };

  const getClassNames = (classIds: string[]) => {
    return classIds
      .map((id) => {
        const cls = classes.find((c) => c._id?.toString() === id);
        return cls?.name;
      })
      .filter(Boolean)
      .join(", ");
  };

  const filteredDocuments = documents.filter((doc) => {
    if (selectedCategory !== "Tất cả" && doc.category !== selectedCategory) {
      return false;
    }
    if (selectedGrade !== "Tất cả" && doc.grade !== selectedGrade) {
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
              Quản Lý Tài Liệu
            </h1>
            <p className="text-lg" style={{ color: colors.brown }}>
              Upload và quản lý tài liệu học tập
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
            style={{
              backgroundColor: colors.mediumGreen,
            }}
          >
            + Thêm tài liệu
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
                    e.target.value as DocumentCategory | "Tất cả"
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

        {/* Documents list */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: colors.lightGreen }}>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Tên tài liệu
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
                  Ghi chú
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
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {documents.length === 0
                      ? "Chưa có tài liệu nào"
                      : "Không tìm thấy tài liệu phù hợp"}
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr
                    key={doc._id?.toString() || ""}
                    className="border-b border-gray-200/80 hover:bg-gray-50"
                  >
                    <td
                      className="px-6 py-4 text-sm font-medium"
                      style={{ color: colors.darkBrown }}
                    >
                      {doc.name}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {doc.category}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {doc.grade ? `Khối ${doc.grade}` : "-"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {doc.note || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenShareModal(doc)}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: colors.mediumGreen,
                            color: "white",
                          }}
                        >
                          Chia sẻ
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id?.toString() || "")}
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
            className="bg-white rounded-lg max-w-2xl w-full mx-4 h-[85vh] flex flex-col"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div className="p-6 flex-shrink-0 border-b" style={{ borderColor: colors.light }}>
              <div className="flex items-center justify-between">
                <h3
                  className="text-xl font-bold"
                  style={{ color: colors.darkBrown }}
                >
                  Thêm tài liệu mới
                </h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setFormData({
                      name: "",
                      file: null,
                      grade: "",
                      note: "",
                      category: "Bài tập",
                    });
                  }}
                  className="text-2xl font-bold"
                  style={{ color: colors.brown }}
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="px-6 pb-4 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.darkBrown }}
                  >
                    Tên tài liệu *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
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
                    File PDF *
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
                        category: e.target.value as DocumentCategory,
                      })
                    }
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
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
                    Khối
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) =>
                      setFormData({ ...formData, grade: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: colors.brown,
                      color: colors.darkBrown,
                    }}
                  >
                    <option value="">Chọn khối (tùy chọn)</option>
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
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: colors.brown,
                      color: colors.darkBrown,
                    }}
                    rows={3}
                  />
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
                    setFormData({
                      name: "",
                      file: null,
                      grade: "",
                      note: "",
                      category: "Bài tập",
                    });
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
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colors.mediumGreen,
                  }}
                >
                  {uploading ? "Đang upload..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedDocForShare && (
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
                  Chia sẻ tài liệu: {selectedDocForShare.name}
                </h3>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedDocForShare(null);
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
                Chọn các lớp được phép xem tài liệu này:
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
                  setSelectedDocForShare(null);
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

