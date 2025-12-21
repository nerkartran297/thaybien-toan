"use client";

import { useState, useEffect } from "react";
import { User } from "@/models/User";
import { Class } from "@/models/Class";
import { Attendance } from "@/models/Attendance";
import { useAuth } from "@/contexts/AuthContext";

interface StudentDetailModalProps {
  student: User;
  onClose: () => void;
  onUpdateStudent: (studentId: string, data: Partial<User>) => Promise<void>;
  onAddToClass: (classId: string, studentId: string) => Promise<void>;
  onRemoveFromClass: (classId: string, studentId: string) => Promise<void>;
}

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

export default function StudentDetailModal({
  student,
  onClose,
  onUpdateStudent,
  onAddToClass,
  onRemoveFromClass,
}: StudentDetailModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "classes" | "attendance">(
    "info"
  );
  const [studentProfile, setStudentProfile] = useState<{
    grade?: number | null;
    group?: string | null;
  }>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showBulkAttendanceModal, setShowBulkAttendanceModal] = useState(false);
  const [, setBulkAttendanceDates] = useState<string[]>([]);
  const [bulkAttendanceText, setBulkAttendanceText] = useState<string>("");
  // Enrollment-related state has been removed
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch classes
      const classesRes = await fetch("/api/classes");
      const classesData = await classesRes.json();
      setClasses(classesData);

      // Fetch student profile for grade and group
      try {
        const profileRes = await fetch(`/api/students/${student._id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setStudentProfile({
            grade: profileData.grade || null,
            group: profileData.group || null,
          });
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
        // Fallback to student object if it has grade/group
        const studentWithProfile = student as User & {
          grade?: number | null;
          group?: string | null;
        };
        setStudentProfile({
          grade: studentWithProfile.grade || null,
          group: studentWithProfile.group || null,
        });
      }

      // Fetch attendance
      const attendanceRes = await fetch(
        `/api/attendance?studentId=${student._id}`
      );
      const attendanceData = await attendanceRes.json();
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditField = (field: string, currentValue: unknown) => {
    setEditingField(field);
    setEditValue(
      typeof currentValue === "string"
        ? currentValue
        : String(currentValue || "")
    );
  };

  const handleSaveField = async () => {
    if (!editingField) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (editingField === "grade") {
        // Update grade in student profile
        const grade = parseInt(editValue);
        if (isNaN(grade) || grade < 6 || grade > 12) {
          alert("Khối phải là số từ 6 đến 12");
          return;
        }
        try {
          const response = await fetch(`/api/students/${student._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grade }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update grade");
          }
          const updatedProfile = await response.json();
          setStudentProfile({ ...studentProfile, grade: updatedProfile.grade });
        } catch (error) {
          console.error("Error updating grade:", error);
          alert(
            error instanceof Error
              ? error.message
              : "Có lỗi xảy ra khi cập nhật khối"
          );
          return;
        }
      } else {
        updateData[editingField] = editValue;
        await onUpdateStudent(student._id!.toString(), updateData);
      }

      setEditingField(null);
      setEditValue("");
      await fetchData();
    } catch (error) {
      console.error("Error updating:", error);
      alert("Có lỗi xảy ra khi cập nhật");
    }
  };

  const handleAddBulkAttendance = async () => {
    // Parse dates from text, filter out empty lines
    const dates = bulkAttendanceText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!dates.length || !user?._id) {
      alert("Vui lòng chọn ít nhất một ngày");
      return;
    }

    try {
      // Note: Enrollment functionality has been removed
      // This function may need to be updated or removed
      alert(
        "Chức năng này đã được gỡ bỏ. Vui lòng sử dụng tab Lớp học để quản lý."
      );
      return;
    } catch (error) {
      console.error("Error creating bulk attendance:", error);
      alert("Có lỗi xảy ra khi tạo điểm danh");
    }
  };

  // Sort classes by format DD-HH:MM-CODE (e.g., "T3-10:30-A")
  // Priority: DD (alphabet) -> HH:MM (time) -> CODE (alphabet)
  const parseClassName = (name: string) => {
    const parts = name.split("-");
    if (parts.length >= 3) {
      return {
        day: parts[0], // DD (e.g., "T3")
        time: parts[1], // HH:MM (e.g., "10:30")
        code: parts.slice(2).join("-"), // CODE (e.g., "A")
      };
    }
    return { day: "", time: "", code: name };
  };

  const studentClasses = classes
    .filter((cls) =>
      cls.enrolledStudents.some(
        (id) => id.toString() === student._id?.toString()
      )
    )
    .sort((a, b) => {
      const aParsed = parseClassName(a.name);
      const bParsed = parseClassName(b.name);

      // Compare by day (DD) first
      const dayCompare = aParsed.day.localeCompare(bParsed.day);
      if (dayCompare !== 0) return dayCompare;

      // Then compare by time (HH:MM)
      const timeCompare = aParsed.time.localeCompare(bParsed.time);
      if (timeCompare !== 0) return timeCompare;

      // Finally compare by code
      return aParsed.code.localeCompare(bParsed.code);
    });

  const availableClasses = classes.filter(
    (cls) =>
      cls.isActive &&
      !cls.enrolledStudents.some(
        (id) => id.toString() === student._id?.toString()
      ) &&
      true // maxStudents no longer exists
  );

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg p-6"
          style={{ borderColor: colors.brown, borderWidth: "2px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ color: colors.darkBrown }}>Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ borderColor: colors.brown, borderWidth: "2px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className="text-2xl font-bold"
            style={{ color: colors.darkBrown }}
          >
            Chi tiết học viên: {student.fullName}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl font-bold"
            style={{ color: colors.brown }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          {(
            [
              { key: "info", label: "Thông tin" },
              { key: "classes", label: "Lớp học" },
              { key: "attendance", label: "Lịch sử học" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(tab.key as "info" | "classes" | "attendance")
              }
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.key ? "border-b-2" : "hover:bg-gray-100"
              }`}
              style={{
                borderBottomColor:
                  activeTab === tab.key ? colors.mediumGreen : "transparent",
                color: activeTab === tab.key ? colors.darkBrown : colors.brown,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "info" && (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Họ và tên
                </label>
                {editingField === "fullName" ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded"
                      style={{ borderColor: colors.brown }}
                    />
                    <button
                      onClick={handleSaveField}
                      className="px-3 py-2 rounded text-white"
                      style={{ backgroundColor: colors.mediumGreen }}
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      className="px-3 py-2 rounded"
                      style={{
                        backgroundColor: colors.light,
                        color: colors.darkBrown,
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.brown }}>
                      {student.fullName}
                    </span>
                    <button
                      onClick={() =>
                        handleEditField("fullName", student.fullName)
                      }
                      className="text-sm px-2 py-1 rounded"
                      style={{
                        backgroundColor: colors.lightGreen,
                        color: colors.darkBrown,
                      }}
                    >
                      Sửa
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Email
                </label>
                <span style={{ color: colors.brown }}>
                  {student.email || "N/A"}
                </span>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Số điện thoại
                </label>
                {editingField === "phone" ? (
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded"
                      style={{ borderColor: colors.brown }}
                    />
                    <button
                      onClick={handleSaveField}
                      className="px-3 py-2 rounded text-white"
                      style={{ backgroundColor: colors.mediumGreen }}
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      className="px-3 py-2 rounded"
                      style={{
                        backgroundColor: colors.light,
                        color: colors.darkBrown,
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.brown }}>
                      {student.phone || "-"}
                    </span>
                    <button
                      onClick={() => handleEditField("phone", student.phone)}
                      className="text-sm px-2 py-1 rounded"
                      style={{
                        backgroundColor: colors.lightGreen,
                        color: colors.darkBrown,
                      }}
                    >
                      Sửa
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Ngày sinh
                </label>
                <span style={{ color: colors.brown }}>
                  {student.dateOfBirth
                    ? new Date(student.dateOfBirth).toLocaleDateString("vi-VN")
                    : "-"}
                </span>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Địa chỉ
                </label>
                <span style={{ color: colors.brown }}>
                  {student.address || "-"}
                </span>
              </div>

              {student.emergencyContact && (
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Liên hệ khẩn cấp
                  </label>
                  <div className="pl-4" style={{ color: colors.brown }}>
                    <div>Tên: {student.emergencyContact.name}</div>
                    <div>SĐT: {student.emergencyContact.phone}</div>
                    <div>
                      Mối quan hệ: {student.emergencyContact.relationship}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Lớp
                </label>
                <span style={{ color: colors.brown }}>
                  {studentProfile.group || "-"}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  (Sửa ở tab Lớp học)
                </span>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Khối
                </label>
                {editingField === "grade" ? (
                  <div className="flex gap-2">
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded"
                      style={{ borderColor: colors.brown }}
                    >
                      <option value="">Chọn khối</option>
                      {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveField}
                      className="px-3 py-2 rounded text-white"
                      style={{ backgroundColor: colors.mediumGreen }}
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      className="px-3 py-2 rounded"
                      style={{
                        backgroundColor: colors.light,
                        color: colors.darkBrown,
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.brown }}>
                      {studentProfile.grade || "-"}
                    </span>
                    <button
                      onClick={() =>
                        handleEditField("grade", studentProfile.grade || "")
                      }
                      className="text-sm px-2 py-1 rounded"
                      style={{
                        backgroundColor: colors.lightGreen,
                        color: colors.darkBrown,
                      }}
                    >
                      Sửa
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enrollment tab has been removed - all content deleted */}

          {activeTab === "classes" && (
            <div className="space-y-4">
              <div>
                <h4
                  className="font-semibold mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Lớp học hiện tại
                </h4>
                {studentClasses.length === 0 ? (
                  <p style={{ color: colors.brown }}>
                    Học viên chưa tham gia lớp nào
                  </p>
                ) : (
                  <div className="space-y-2">
                    {studentClasses.map((cls) => {
                      // courseId no longer exists on Class, so we can't find the course
                      // const course = null;
                      return (
                        <div
                          key={cls._id?.toString()}
                          className="border rounded p-3 flex justify-between items-center"
                          style={{ borderColor: colors.brown }}
                        >
                          <div>
                            <div
                              className="font-medium"
                              style={{ color: colors.darkBrown }}
                            >
                              {cls.name}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: colors.brown }}
                            >
                              Khối {cls.grade} • {cls.enrolledStudents.length}{" "}
                              học viên
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  "Bạn có chắc muốn xóa học viên khỏi lớp này?"
                                )
                              ) {
                                await onRemoveFromClass(
                                  cls._id!.toString(),
                                  student._id!.toString()
                                );
                                await fetchData();
                              }
                            }}
                            className="px-3 py-1 rounded text-sm text-white"
                            style={{ backgroundColor: "#EF4444" }}
                          >
                            Xóa khỏi lớp
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h4
                  className="font-semibold mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Thêm vào lớp học
                </h4>
                {availableClasses.length === 0 ? (
                  <p style={{ color: colors.brown }}>
                    Không có lớp học nào khả dụng
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableClasses.map((cls) => {
                      // courseId no longer exists on Class, so we can't find the course
                      // const course = null;
                      return (
                        <div
                          key={cls._id?.toString()}
                          className="border rounded p-3 flex justify-between items-center"
                          style={{ borderColor: colors.brown }}
                        >
                          <div>
                            <div
                              className="font-medium"
                              style={{ color: colors.darkBrown }}
                            >
                              {cls.name}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: colors.brown }}
                            >
                              Khối {cls.grade} • {cls.enrolledStudents.length}{" "}
                              học viên
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              await onAddToClass(
                                cls._id!.toString(),
                                student._id!.toString()
                              );
                              await fetchData();
                            }}
                            className="px-3 py-1 rounded text-sm text-white"
                            style={{ backgroundColor: colors.mediumGreen }}
                          >
                            Thêm vào lớp
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enrollment modals have been removed */}

          {activeTab === "classes" && (
            <div className="space-y-4">
              <div>
                <h4
                  className="font-semibold mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Lớp học hiện tại
                </h4>
                {studentClasses.length === 0 ? (
                  <p style={{ color: colors.brown }}>
                    Học viên chưa tham gia lớp nào
                  </p>
                ) : (
                  <div className="space-y-2">
                    {studentClasses.map((cls) => {
                      // courseId no longer exists on Class, so we can't find the course
                      // const course = null;
                      return (
                        <div
                          key={cls._id?.toString()}
                          className="border rounded p-3 flex justify-between items-center"
                          style={{ borderColor: colors.brown }}
                        >
                          <div>
                            <div
                              className="font-medium"
                              style={{ color: colors.darkBrown }}
                            >
                              {cls.name}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: colors.brown }}
                            >
                              {cls.name} • {cls.enrolledStudents.length} học
                              viên
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  "Bạn có chắc muốn xóa học viên khỏi lớp này?"
                                )
                              ) {
                                await onRemoveFromClass(
                                  cls._id!.toString(),
                                  student._id!.toString()
                                );
                                await fetchData();
                              }
                            }}
                            className="px-3 py-1 rounded text-sm text-white"
                            style={{ backgroundColor: "#EF4444" }}
                          >
                            Xóa khỏi lớp
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h4
                  className="font-semibold mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Thêm vào lớp học
                </h4>
                {availableClasses.length === 0 ? (
                  <p style={{ color: colors.brown }}>
                    Không có lớp học nào khả dụng
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableClasses.map((cls) => {
                      // courseId no longer exists on Class, so we can't find the course
                      // const course = null;
                      return (
                        <div
                          key={cls._id?.toString()}
                          className="border rounded p-3 flex justify-between items-center"
                          style={{ borderColor: colors.brown }}
                        >
                          <div>
                            <div
                              className="font-medium"
                              style={{ color: colors.darkBrown }}
                            >
                              {cls.name}
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: colors.brown }}
                            >
                              {cls.name} • {cls.enrolledStudents.length} học
                              viên
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              await onAddToClass(
                                cls._id!.toString(),
                                student._id!.toString()
                              );
                              await fetchData();
                            }}
                            className="px-3 py-1 rounded text-sm text-white"
                            style={{ backgroundColor: colors.mediumGreen }}
                          >
                            Thêm vào lớp
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4
                  className="font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Lịch sử điểm danh
                </h4>
                <button
                  onClick={() => setShowBulkAttendanceModal(true)}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: colors.mediumGreen }}
                >
                  Thêm điểm danh hàng loạt
                </button>
              </div>
              {attendance.length === 0 ? (
                <p style={{ color: colors.brown }}>Chưa có lịch sử điểm danh</p>
              ) : (
                <div className="space-y-2">
                  {attendance
                    .sort(
                      (a, b) =>
                        new Date(b.sessionDate).getTime() -
                        new Date(a.sessionDate).getTime()
                    )
                    .map((record) => {
                      const cls = record.classId
                        ? classes.find(
                            (c) =>
                              c._id?.toString() === record.classId?.toString()
                          )
                        : null;
                      return (
                        <div
                          key={record._id?.toString()}
                          className="border rounded p-3"
                          style={{ borderColor: colors.brown }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div
                                className="font-medium"
                                style={{ color: colors.darkBrown }}
                              >
                                {cls?.name || "Không xác định"}
                              </div>
                              <div
                                className="text-sm"
                                style={{ color: colors.brown }}
                              >
                                {new Date(
                                  record.sessionDate
                                ).toLocaleDateString("vi-VN", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                            <div
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                record.status === "present"
                                  ? "bg-green-100 text-green-800"
                                  : record.status === "absent"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {record.status === "present"
                                ? "Có mặt"
                                : record.status === "absent"
                                ? "Vắng"
                                : "Có phép"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Bulk Attendance Modal */}
          {showBulkAttendanceModal && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            >
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: colors.darkBrown }}
                >
                  Thêm điểm danh hàng loạt
                </h3>
                <p className="text-sm mb-4" style={{ color: colors.brown }}>
                  Nhập các ngày học viên đã đi học (mỗi ngày một dòng, format:
                  dd/mm/yyyy)
                </p>
                <textarea
                  value={bulkAttendanceText}
                  onChange={(e) => {
                    setBulkAttendanceText(e.target.value);
                  }}
                  placeholder="01/01/2024&#10;08/01/2024&#10;15/01/2024"
                  className="w-full border rounded p-3 mb-4"
                  rows={10}
                  style={{ borderColor: colors.brown }}
                  onKeyDown={(e) => {
                    // Allow Enter key to work normally
                    if (e.key === "Enter") {
                      e.stopPropagation();
                    }
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowBulkAttendanceModal(false);
                      setBulkAttendanceText("");
                      setBulkAttendanceDates([]);
                    }}
                    className="px-4 py-2 rounded"
                    style={{
                      backgroundColor: colors.light,
                      color: colors.darkBrown,
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddBulkAttendance}
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: colors.mediumGreen }}
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
