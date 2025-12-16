"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import CreateClassModal from "@/app/components/CreateClassModal";
import { useAuth } from "@/contexts/AuthContext";
import { Class, CreateClassData } from "@/models/Class";
import { User } from "@/models/User";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

interface StudentWithProfile extends User {
  grade?: number | null;
  group?: string | null;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const groupId = params?.groupId as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [classStudents, setClassStudents] = useState<StudentWithProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [addingStudents, setAddingStudents] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsList, setShowStudentsList] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher" && groupId) {
      fetchClassData();
    }
  }, [user, groupId]);

  useEffect(() => {
    if (classData) {
      fetchClassStudents();
    }
  }, [classData]);

  const fetchClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setClassData(data);
      } else {
        alert("Không tìm thấy lớp học");
        router.push("/teacher/classes");
      }
    } catch (error) {
      console.error("Error fetching class:", error);
      alert("Có lỗi xảy ra khi tải thông tin lớp học");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async () => {
    if (!classData) return;

    setLoadingStudents(true);
    try {
      const studentsRes = await fetch("/api/students");
      if (studentsRes.ok) {
        const allStudents = await studentsRes.json();

        const enrolledStudentIds = new Set(
          classData.enrolledStudents?.map((id) =>
            typeof id === "string" ? id : id?.toString()
          ) || []
        );

        const studentsInClass = allStudents.filter(
          (student: StudentWithProfile) =>
            enrolledStudentIds.has(student._id?.toString() || "")
        );

        setClassStudents(studentsInClass);
      }
    } catch (error) {
      console.error("Error fetching class students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await fetch("/api/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenAddStudents = async () => {
    setSelectedStudentIds(new Set());
    setSearchTerm("");
    setShowAddStudentsModal(true);
    await fetchStudents();
  };

  const handleToggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const handleAddStudents = async () => {
    if (!classData || selectedStudentIds.size === 0) return;

    setAddingStudents(true);
    try {
      const promises = Array.from(selectedStudentIds).map((studentId) =>
        fetch(`/api/classes/${classData._id}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        })
      );

      const results = await Promise.allSettled(promises);
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.error("Some students failed to add:", failed);
        alert(
          `Đã thêm ${selectedStudentIds.size - failed.length} học sinh. ${failed.length} học sinh không thể thêm (có thể đã có trong lớp).`
        );
      } else {
        alert(`Đã thêm ${selectedStudentIds.size} học sinh vào lớp thành công!`);
      }

      await fetchClassData();
      await fetchClassStudents();
      setShowAddStudentsModal(false);
      setSelectedStudentIds(new Set());
    } catch (error) {
      console.error("Error adding students:", error);
      alert("Có lỗi xảy ra khi thêm học sinh vào lớp");
    } finally {
      setAddingStudents(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!classData) return;

    if (confirm("Bạn có chắc muốn xóa học sinh này khỏi lớp?")) {
      try {
        const response = await fetch(
          `/api/classes/${classData._id}/students?studentId=${studentId}`,
          { method: "DELETE" }
        );
        if (response.ok) {
          await fetchClassData();
          await fetchClassStudents();
        } else {
          alert("Có lỗi xảy ra khi xóa học sinh");
        }
      } catch (error) {
        console.error("Error removing student:", error);
        alert("Có lỗi xảy ra khi xóa học sinh");
      }
    }
  };

  const handleEditSessions = () => {
    setShowEditModal(true);
  };

  const handleUpdateClass = async (data: CreateClassData) => {
    if (!classData) return;

    try {
      const response = await fetch(`/api/classes/${classData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchClassData();
        setShowEditModal(false);
        alert("Cập nhật ca học thành công!");
      } else {
        const error = await response.json();
        alert(error.error || "Có lỗi xảy ra khi cập nhật ca học");
      }
    } catch (error) {
      console.error("Error updating class:", error);
      alert("Có lỗi xảy ra khi cập nhật ca học");
    }
  };

  const formatSession = (session: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => {
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${dayNames[session.dayOfWeek]}-${session.startTime}-${session.endTime}`;
  };

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.fullName.toLowerCase().includes(searchLower) ||
      student.phone?.toLowerCase().includes(searchLower) ||
      student.grade?.toString().includes(searchLower) ||
      student.group?.toLowerCase().includes(searchLower) ||
      student.note?.toLowerCase().includes(searchLower)
    );
  });

  const availableStudents = filteredStudents.filter((student) => {
    if (!classData) return true;
    return !classData.enrolledStudents.some(
      (id) => id.toString() === student._id?.toString()
    );
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

  if (!classData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.light }}
      >
        <div className="text-lg" style={{ color: colors.darkBrown }}>
          Không tìm thấy lớp học
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      <Navigation />

      {/* Edit Sessions Modal */}
      {showEditModal && classData && (
        <CreateClassModal
          onClose={() => {
            setShowEditModal(false);
          }}
          onSubmit={handleUpdateClass}
          initialData={{
            name: classData.name,
            grade: classData.grade,
            sessions: classData.sessions || [],
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: colors.darkBrown }}
              >
                {classData.name}
              </h1>
              <p className="text-lg" style={{ color: colors.brown }}>
                Khối {classData.grade}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOpenAddStudents}
                className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
                style={{
                  backgroundColor: colors.mediumGreen,
                }}
              >
                + Thêm học sinh
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-4 border-b" style={{ borderColor: colors.light }}>
            <div className="flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{ color: colors.darkBrown }}
              >
                Ca học trong tuần
              </h2>
              <button
                onClick={handleEditSessions}
                className="px-3 py-1 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "#3B82F6",
                  color: "white",
                }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead style={{ backgroundColor: colors.lightGreen }}>
              <tr>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Thứ
                </th>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody>
              {classData.sessions && classData.sessions.length > 0 ? (
                classData.sessions.map((session, idx) => {
                  const dayNames = [
                    "Chủ nhật",
                    "Thứ hai",
                    "Thứ ba",
                    "Thứ tư",
                    "Thứ năm",
                    "Thứ sáu",
                    "Thứ bảy",
                  ];
                  return (
                    <tr
                      key={idx}
                      className="border-b border-gray-200/80 hover:bg-gray-50"
                    >
                      <td
                        className="px-6 py-3 text-sm"
                        style={{ color: colors.darkBrown }}
                      >
                        {dayNames[session.dayOfWeek]}
                      </td>
                      <td
                        className="px-6 py-3 text-sm"
                        style={{ color: colors.brown }}
                      >
                        {session.startTime} - {session.endTime}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Chưa có ca học nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: colors.light }}>
            <div className="flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{ color: colors.darkBrown }}
              >
                Danh sách học sinh ({classStudents.length})
              </h2>
              <button
                onClick={() => setShowStudentsList(!showStudentsList)}
                className="px-3 py-1 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: colors.brown,
                  color: "white",
                }}
              >
                {showStudentsList ? "Ẩn danh sách" : "Hiện danh sách"}
              </button>
            </div>
          </div>
          {showStudentsList && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.lightGreen }}>
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold"
                      style={{ color: colors.darkBrown }}
                    >
                      Tên
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold"
                      style={{ color: colors.darkBrown }}
                    >
                      Lớp
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold"
                      style={{ color: colors.darkBrown }}
                    >
                      Khối
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold"
                      style={{ color: colors.darkBrown }}
                    >
                      Số điện thoại
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-semibold"
                      style={{ color: colors.darkBrown }}
                    >
                      Ghi chú
                    </th>
                    <th
                      className="px-6 py-3 text-center text-sm font-semibold"
                      style={{ color: colors.darkBrown }}
                    >
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStudents ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Đang tải...
                      </td>
                    </tr>
                  ) : classStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Lớp này chưa có học sinh nào
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((student) => {
                      const studentId = student._id?.toString() || "";
                      return (
                        <tr
                          key={studentId}
                          className="border-b border-gray-200/80 hover:bg-gray-50"
                        >
                          <td
                            className="px-6 py-3 text-sm font-medium"
                            style={{ color: colors.darkBrown }}
                          >
                            {student.fullName}
                          </td>
                          <td
                            className="px-6 py-3 text-sm"
                            style={{ color: colors.brown }}
                          >
                            {student.group || "-"}
                          </td>
                          <td
                            className="px-6 py-3 text-sm"
                            style={{ color: colors.brown }}
                          >
                            {student.grade ? `Khối ${student.grade}` : "-"}
                          </td>
                          <td
                            className="px-6 py-3 text-sm"
                            style={{ color: colors.brown }}
                          >
                            {student.phone || "-"}
                          </td>
                          <td
                            className="px-6 py-3 text-sm"
                            style={{ color: colors.brown }}
                          >
                            {student.note || "-"}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <button
                              onClick={() => handleRemoveStudent(studentId)}
                              className="px-3 py-1 rounded text-sm font-medium transition-colors"
                              style={{
                                backgroundColor: "#DC2626",
                                color: "white",
                              }}
                            >
                              Xóa khỏi lớp
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Students Modal */}
      {showAddStudentsModal && classData && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full mx-4 h-[85vh] flex flex-col"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div className="p-6 flex-shrink-0 border-b" style={{ borderColor: colors.light }}>
              <div className="flex items-center justify-between">
                <h3
                  className="text-xl font-bold"
                  style={{ color: colors.darkBrown }}
                >
                  Thêm học sinh vào lớp: {classData.name}
                </h3>
                <button
                  onClick={() => {
                    setShowAddStudentsModal(false);
                    setSelectedStudentIds(new Set());
                  }}
                  className="text-2xl font-bold"
                  style={{ color: colors.brown }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Search bar */}
              <div className="p-4 border-b flex-shrink-0" style={{ borderColor: colors.light }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  style={{
                    borderColor: colors.brown,
                    color: colors.darkBrown,
                  }}
                />
              </div>

              {/* Students table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0" style={{ backgroundColor: colors.lightGreen }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: colors.darkBrown }}>
                        Chọn
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: colors.darkBrown }}>
                        Tên
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: colors.darkBrown }}>
                        Lớp
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: colors.darkBrown }}>
                        Khối
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: colors.darkBrown }}>
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {searchTerm
                            ? "Không tìm thấy học sinh nào"
                            : "Tất cả học sinh đã có trong lớp"}
                        </td>
                      </tr>
                    ) : (
                      availableStudents.map((student) => {
                        const studentId = student._id?.toString() || "";
                        return (
                          <tr
                            key={studentId}
                            className="border-b border-gray-200/80 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.has(studentId)}
                                onChange={() => handleToggleStudent(studentId)}
                                className="w-4 h-4"
                                style={{ accentColor: colors.mediumGreen }}
                              />
                            </td>
                            <td
                              className="px-4 py-3 text-sm font-medium"
                              style={{ color: colors.darkBrown }}
                            >
                              {student.fullName}
                            </td>
                            <td
                              className="px-4 py-3 text-sm"
                              style={{ color: colors.brown }}
                            >
                              {student.group || "-"}
                            </td>
                            <td
                              className="px-4 py-3 text-sm"
                              style={{ color: colors.brown }}
                            >
                              {student.grade ? `Khối ${student.grade}` : "-"}
                            </td>
                            <td
                              className="px-4 py-3 text-sm"
                              style={{ color: colors.brown }}
                            >
                              {student.note || "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div
              className="p-6 pt-4 border-t flex justify-between items-center flex-shrink-0"
              style={{ borderColor: colors.light }}
            >
              <div className="text-sm" style={{ color: colors.brown }}>
                Đã chọn: {selectedStudentIds.size} học sinh
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddStudentsModal(false);
                    setSelectedStudentIds(new Set());
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
                  onClick={handleAddStudents}
                  disabled={selectedStudentIds.size === 0 || addingStudents}
                  className="px-4 py-2 rounded-lg text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colors.mediumGreen,
                  }}
                >
                  {addingStudents ? "Đang thêm..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

