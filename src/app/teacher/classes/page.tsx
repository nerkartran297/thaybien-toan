"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import CreateClassModal from "@/app/components/CreateClassModal";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
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

export default function ClassesManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [students] = useState<StudentWithProfile[]>([]);
  // const [setStudents] = useState<StudentWithProfile[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingStudents] = useState(false);
  // const [setLoadingStudents] = useState(false);
  const [addingStudents, setAddingStudents] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher") {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes?isActive=true");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (data: CreateClassData) => {
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchClasses();
        setShowCreateModal(false);
        alert("Tạo lớp thành công!");
      } else {
        const error = await response.json();
        alert(error.error || "Có lỗi xảy ra khi tạo lớp");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      alert("Có lỗi xảy ra khi tạo lớp");
    }
  };

  const handleUpdateClass = async (data: CreateClassData) => {
    if (!editingClass) return;

    try {
      const response = await fetch(`/api/classes/${editingClass._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchClasses();
        setShowEditModal(false);
        setEditingClass(null);
        alert("Cập nhật lớp học thành công!");
      } else {
        const error = await response.json();
        alert(error.error || "Có lỗi xảy ra khi cập nhật lớp học");
      }
    } catch (error) {
      console.error("Error updating class:", error);
      alert("Có lỗi xảy ra khi cập nhật lớp học");
    }
  };

  const formatSession = (session: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => {
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${dayNames[session.dayOfWeek]}-${session.startTime}-${
      session.endTime
    }`;
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
    if (!selectedClass || selectedStudentIds.size === 0) return;

    setAddingStudents(true);
    try {
      const promises = Array.from(selectedStudentIds).map((studentId) =>
        fetch(`/api/classes/${selectedClass._id}/students`, {
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
          `Đã thêm ${selectedStudentIds.size - failed.length} học sinh. ${
            failed.length
          } học sinh không thể thêm (có thể đã có trong lớp).`
        );
      } else {
        alert(
          `Đã thêm ${selectedStudentIds.size} học sinh vào lớp thành công!`
        );
      }

      await fetchClasses();
      setShowAddStudentsModal(false);
      setSelectedClass(null);
      setSelectedStudentIds(new Set());
    } catch (error) {
      console.error("Error adding students:", error);
      alert("Có lỗi xảy ra khi thêm học sinh vào lớp");
    } finally {
      setAddingStudents(false);
    }
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

  // Filter out students already in the class
  const availableStudents = filteredStudents.filter((student) => {
    if (!selectedClass) return true;
    return !selectedClass.enrolledStudents.some(
      (id) => id.toString() === student._id?.toString()
    );
  });

  if (authLoading || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--page-background)" }}
      >
        <div className="text-lg" style={{ color: "#6C584C" }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      <Navigation />

      {/* Create Class Modal */}
      {showCreateModal && (
        <CreateClassModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingClass(null);
          }}
          onSubmit={handleCreateClass}
          initialData={undefined}
        />
      )}

      {/* Edit Class Modal */}
      {showEditModal && editingClass && (
        <CreateClassModal
          onClose={() => {
            setShowEditModal(false);
            setEditingClass(null);
          }}
          onSubmit={handleUpdateClass}
          initialData={{
            name: editingClass.name,
            grade: editingClass.grade,
            sessions: editingClass.sessions || [],
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: colors.darkBrown }}
            >
              Quản Lý Lớp Học
            </h1>
            <p className="text-lg" style={{ color: colors.brown }}>
              Quản lý danh sách lớp học và học sinh
            </p>
          </div>
          <button
            onClick={() => {
              setEditingClass(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
            style={{
              backgroundColor: colors.mediumGreen,
            }}
          >
            + Tạo lớp mới
          </button>
        </div>

        {/* Classes list */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: colors.lightGreen }}>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Tên lớp
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
                  Ca học
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Số học sinh
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Chưa có lớp học nào
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr
                    key={cls._id?.toString() || ""}
                    className="border-b border-gray-200/80 hover:bg-gray-50"
                  >
                    <td
                      className="px-6 py-4 text-sm font-medium"
                      style={{ color: colors.darkBrown }}
                    >
                      <Link
                        href={`/teacher/group/${cls._id}`}
                        className="hover:underline"
                        style={{ color: colors.darkBrown }}
                      >
                        {cls.name}
                      </Link>
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      Khối {cls.grade}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      <div className="space-y-1">
                        {cls.sessions && cls.sessions.length > 0 ? (
                          cls.sessions.map((session, idx) => (
                            <div key={idx}>{formatSession(session)}</div>
                          ))
                        ) : (
                          <span className="text-gray-400">Chưa có ca học</span>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {cls.enrolledStudents?.length || 0} học sinh
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Students Modal */}
      {showAddStudentsModal && selectedClass && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full mx-4 h-[85vh] flex flex-col"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div
              className="p-6 flex-shrink-0 border-b"
              style={{ borderColor: colors.light }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: colors.darkBrown }}
                  >
                    Thêm học sinh vào lớp: {selectedClass.name}
                  </h3>
                  <p className="text-sm" style={{ color: colors.brown }}>
                    Khối {selectedClass.grade} -{" "}
                    {selectedClass.sessions?.length || 0} ca học
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddStudentsModal(false);
                    setSelectedClass(null);
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
              <div
                className="p-4 border-b"
                style={{ borderColor: colors.light }}
              >
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh (tên, số điện thoại, khối, lớp, ghi chú)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                  style={{ borderColor: colors.brown }}
                />
              </div>

              {/* Students table */}
              <div className="flex-1 overflow-y-auto">
                {loadingStudents ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-lg" style={{ color: colors.brown }}>
                      Đang tải...
                    </div>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead
                      className="sticky top-0"
                      style={{ backgroundColor: colors.lightGreen }}
                    >
                      <tr>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold"
                          style={{ color: colors.darkBrown }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              availableStudents.length > 0 &&
                              availableStudents.every((s) =>
                                selectedStudentIds.has(s._id?.toString() || "")
                              )
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allIds = new Set(
                                  availableStudents.map(
                                    (s) => s._id?.toString() || ""
                                  )
                                );
                                setSelectedStudentIds(allIds);
                              } else {
                                setSelectedStudentIds(new Set());
                              }
                            }}
                            className="w-4 h-4 cursor-pointer"
                            style={{ accentColor: colors.mediumGreen }}
                          />
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold"
                          style={{ color: colors.darkBrown }}
                        >
                          Tên
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold"
                          style={{ color: colors.darkBrown }}
                        >
                          Lớp
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold"
                          style={{ color: colors.darkBrown }}
                        >
                          Khối
                        </th>
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold"
                          style={{ color: colors.darkBrown }}
                        >
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
                              : "Không còn học sinh nào để thêm"}
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
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.has(studentId)}
                                  onChange={() =>
                                    handleToggleStudent(studentId)
                                  }
                                  className="w-4 h-4 cursor-pointer"
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
                )}
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
                    setSelectedClass(null);
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
