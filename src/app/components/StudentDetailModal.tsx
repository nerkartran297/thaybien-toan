"use client";

import { useState, useEffect } from "react";
import { ObjectId } from "mongodb";
import { User } from "@/models/User";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { Class } from "@/models/Class";
import { Course } from "@/models/Course";
import { Attendance, CreateAttendanceData } from "@/models/Attendance";
import { useAuth } from "@/contexts/AuthContext";

interface StudentDetailModalProps {
  student: User;
  onClose: () => void;
  onUpdateStudent: (studentId: string, data: Partial<User>) => Promise<void>;
  onUpdateEnrollment: (
    enrollmentId: string,
    data: Partial<StudentEnrollment>
  ) => Promise<void>;
  onCreateEnrollment: (
    studentId: string,
    data: Partial<StudentEnrollment>
  ) => Promise<void>;
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
  onUpdateEnrollment,
  onCreateEnrollment,
  onAddToClass,
  onRemoveFromClass,
}: StudentDetailModalProps) {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "info" | "enrollment" | "classes" | "attendance"
  >("info");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showCreateEnrollment, setShowCreateEnrollment] = useState(false);
  const [showBulkAttendanceModal, setShowBulkAttendanceModal] = useState(false);
  const [, setBulkAttendanceDates] = useState<string[]>([]);
  const [bulkAttendanceText, setBulkAttendanceText] = useState<string>("");
  const [bonusSessions, setBonusSessions] = useState<string>("");
  const [bonusWeeks, setBonusWeeks] = useState<string>("");
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [selectedEnrollmentForBonus, setSelectedEnrollmentForBonus] = useState<
    string | null
  >(null);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [selectedEnrollmentForFrequency, setSelectedEnrollmentForFrequency] =
    useState<StudentEnrollment | null>(null);
  const [newFrequency, setNewFrequency] = useState<1 | 2>(1);
  const [selectedClassToAdd, setSelectedClassToAdd] = useState<string>("");
  const [selectedClassToRemove, setSelectedClassToRemove] =
    useState<string>("");
  const [showDeferralModal, setShowDeferralModal] = useState(false);
  const [selectedEnrollmentForDeferral, setSelectedEnrollmentForDeferral] =
    useState<string | null>(null);
  const [deferralWeeks, setDeferralWeeks] = useState<string>("");
  const { user } = useAuth();
  const [newEnrollmentData, setNewEnrollmentData] = useState({
    courseId: "",
    frequency: 1 as 1 | 2,
    startDate: new Date().toISOString().split("T")[0],
    cycle: undefined as number | undefined,
    paymentMode: "default" as "default" | "custom",
    customWeeks: undefined as number | undefined,
  });

  useEffect(() => {
    fetchData();
  }, [student]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch enrollments
      const enrollmentsRes = await fetch(
        `/api/enrollments?studentId=${student._id}`
      );
      const enrollmentsData = await enrollmentsRes.json();
      setEnrollments(enrollmentsData);

      // Fetch classes
      const classesRes = await fetch("/api/classes");
      const classesData = await classesRes.json();
      setClasses(classesData);

      // Fetch courses
      const coursesRes = await fetch("/api/courses");
      const coursesData = await coursesRes.json();
      setCourses(coursesData);

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
      if (editingField.startsWith("startDate-")) {
        // Update enrollment start date
        const enrollmentId = editingField.replace("startDate-", "");
        const enrollment = enrollments.find(
          (e) => e._id?.toString() === enrollmentId
        );
        if (enrollment) {
          await onUpdateEnrollment(enrollmentId, {
            startDate: new Date(editValue),
          });
        }
      } else if (editingField.startsWith("completedSessions-")) {
        // Update completed sessions
        const enrollmentId = editingField.replace("completedSessions-", "");
        const enrollment = enrollments.find(
          (e) => e._id?.toString() === enrollmentId
        );
        if (enrollment) {
          const completed = parseInt(editValue) || 0;
          const total =
            enrollment.completedSessions + enrollment.remainingSessions;
          const remaining = Math.max(0, total - completed);
          await onUpdateEnrollment(enrollmentId, {
            completedSessions: completed,
            remainingSessions: remaining,
          });
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

  const parseDate = (dateStr: string): string | null => {
    // Try dd/mm/yyyy format
    const parts = dateStr.trim().split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        if (
          date.getDate() === day &&
          date.getMonth() === month &&
          date.getFullYear() === year
        ) {
          // Format as YYYY-MM-DD directly to avoid timezone issues
          // Use local date components, not UTC
          const formattedYear = date.getFullYear();
          const formattedMonth = String(date.getMonth() + 1).padStart(2, "0");
          const formattedDay = String(date.getDate()).padStart(2, "0");
          return `${formattedYear}-${formattedMonth}-${formattedDay}`;
        }
      }
    }
    // Try ISO format (yyyy-mm-dd)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    return null;
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
      const enrollment = enrollments[0];
      if (!enrollment) {
        alert("Học sinh chưa có enrollment");
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const invalidDates: string[] = [];

      // Create attendance records for each date
      for (const dateStr of dates) {
        const parsedDate = parseDate(dateStr);
        if (!parsedDate) {
          invalidDates.push(dateStr);
          errorCount++;
          continue;
        }

        const attendanceData: CreateAttendanceData = {
          studentId: student._id!.toString(),
          enrollmentId: enrollment._id!.toString(),
          sessionDate: parsedDate,
          status: "present",
          markedBy: user._id.toString(),
        };

        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attendanceData),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          const error = await response.json();
          console.error(`Failed to create attendance for ${dateStr}:`, error);
        }
      }

      setShowBulkAttendanceModal(false);
      setBulkAttendanceText("");
      setBulkAttendanceDates([]);
      await fetchData();

      let message = `Đã tạo ${successCount} bản ghi điểm danh`;
      if (errorCount > 0) {
        message += `, ${errorCount} lỗi`;
        if (invalidDates.length > 0) {
          message += ` (${invalidDates.length} ngày không hợp lệ: ${invalidDates
            .slice(0, 3)
            .join(", ")}${invalidDates.length > 3 ? "..." : ""})`;
        }
      }
      alert(message);
    } catch (error) {
      console.error("Error creating bulk attendance:", error);
      alert("Có lỗi xảy ra khi tạo điểm danh");
    }
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c._id?.toString() === courseId);
    return course?.name || "Không xác định";
  };

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c._id?.toString() === classId);
    return cls?.name || "Không xác định";
  };

  // Sort classes by format DD-HH:MM-CODE (e.g., "T3-10:30-A")
  // Priority: DD (alphabet) -> HH:MM (time) -> CODE (alphabet)
  const parseClassName = (name: string) => {
    const parts = name.split('-');
    if (parts.length >= 3) {
      return {
        day: parts[0], // DD (e.g., "T3")
        time: parts[1], // HH:MM (e.g., "10:30")
        code: parts.slice(2).join('-'), // CODE (e.g., "A")
      };
    }
    return { day: '', time: '', code: name };
  };

  const studentClasses = classes
    .filter((cls) =>
      cls.enrolledStudents.some((id) => id.toString() === student._id?.toString())
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
              { key: "enrollment", label: "Khóa học" },
              { key: "classes", label: "Lớp học" },
              { key: "attendance", label: "Lịch sử học" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(
                  tab.key as "info" | "enrollment" | "classes" | "attendance"
                )
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
                <span style={{ color: colors.brown }}>{student.email || 'N/A'}</span>
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
            </div>
          )}

          {activeTab === "enrollment" && (
            <div className="space-y-4">
              {enrollments.length === 0 ? (
                <div className="space-y-4">
                  <p style={{ color: colors.brown }}>
                    Học sinh chưa đăng ký khóa học nào
                  </p>
                  {!showCreateEnrollment ? (
                    <button
                      onClick={() => setShowCreateEnrollment(true)}
                      className="px-4 py-2 rounded text-white"
                      style={{ backgroundColor: colors.mediumGreen }}
                    >
                      Thêm khóa học
                    </button>
                  ) : (
                    <div
                      className="border rounded p-4"
                      style={{ borderColor: colors.brown }}
                    >
                      <h4
                        className="font-semibold mb-4"
                        style={{ color: colors.darkBrown }}
                      >
                        Thêm khóa học mới
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label
                            className="block text-sm font-medium mb-1"
                            style={{ color: colors.darkBrown }}
                          >
                            Khóa học *
                          </label>
                          <select
                            value={newEnrollmentData.courseId}
                            onChange={(e) =>
                              setNewEnrollmentData({
                                ...newEnrollmentData,
                                courseId: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded"
                            style={{ borderColor: colors.brown }}
                            required
                          >
                            <option value="">Chọn khóa học</option>
                            {courses.map((course) => (
                              <option
                                key={course._id?.toString()}
                                value={course._id?.toString()}
                              >
                                {course.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {newEnrollmentData.courseId && (
                          <>
                            <div>
                              <label
                                className="block text-sm font-medium mb-1"
                                style={{ color: colors.darkBrown }}
                              >
                                Tần suất học *
                              </label>
                              <select
                                value={newEnrollmentData.frequency}
                                onChange={(e) =>
                                  setNewEnrollmentData({
                                    ...newEnrollmentData,
                                    frequency: parseInt(e.target.value) as
                                      | 1
                                      | 2,
                                  })
                                }
                                className="w-full px-3 py-2 border rounded"
                                style={{ borderColor: colors.brown }}
                                required
                              >
                                <option value={1}>1 buổi/tuần (18 tuần)</option>
                                <option value={2}>2 buổi/tuần (9 tuần)</option>
                              </select>
                            </div>
                            <div>
                              <label
                                className="block text-sm font-medium mb-1"
                                style={{ color: colors.darkBrown }}
                              >
                                Ngày bắt đầu học *
                              </label>
                              <input
                                type="date"
                                required
                                value={newEnrollmentData.startDate}
                                onChange={(e) =>
                                  setNewEnrollmentData({
                                    ...newEnrollmentData,
                                    startDate: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border rounded"
                                style={{ borderColor: colors.brown }}
                              />
                            </div>
                          </>
                        )}

                        {/* Payment Mode */}
                        {newEnrollmentData.courseId &&
                          newEnrollmentData.frequency && (
                            <div>
                              <label
                                className="block text-sm font-medium mb-1"
                                style={{ color: colors.darkBrown }}
                              >
                                Chế độ tính tiền *
                              </label>
                              <select
                                value={newEnrollmentData.paymentMode}
                                onChange={(e) =>
                                  setNewEnrollmentData({
                                    ...newEnrollmentData,
                                    paymentMode: e.target.value as
                                      | "default"
                                      | "custom",
                                    customWeeks: undefined,
                                  })
                                }
                                className="w-full px-3 py-2 border rounded"
                                style={{ borderColor: colors.brown }}
                                required
                              >
                                <option value="default">
                                  Mặc định: 9/18 tuần cho 12 buổi
                                </option>
                                <option value="custom">
                                  Tùy chỉnh: Số tuần × Tần suất = Số buổi
                                </option>
                              </select>
                              <p
                                className="text-xs mt-1"
                                style={{ color: colors.brown }}
                              >
                                {newEnrollmentData.paymentMode === "default"
                                  ? "Mặc định: 1 buổi/tuần = 18 tuần (12 buổi), 2 buổi/tuần = 9 tuần (12 buổi)"
                                  : "Tùy chỉnh: Nhập số tuần, số buổi = số tuần × tần suất học"}
                              </p>
                            </div>
                          )}

                        {/* Custom Weeks */}
                        {newEnrollmentData.courseId &&
                          newEnrollmentData.frequency &&
                          newEnrollmentData.paymentMode === "custom" && (
                            <div>
                              <label
                                className="block text-sm font-medium mb-1"
                                style={{ color: colors.darkBrown }}
                              >
                                Số tuần *
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="52"
                                required
                                value={newEnrollmentData.customWeeks || ""}
                                onChange={(e) =>
                                  setNewEnrollmentData({
                                    ...newEnrollmentData,
                                    customWeeks: e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  })
                                }
                                placeholder="Ví dụ: 4, 6, 8..."
                                className="w-full px-3 py-2 border rounded"
                                style={{ borderColor: colors.brown }}
                              />
                              <p
                                className="text-xs mt-1"
                                style={{ color: colors.brown }}
                              >
                                Số buổi sẽ được tính:{" "}
                                {newEnrollmentData.customWeeks || "?"} tuần ×{" "}
                                {newEnrollmentData.frequency} buổi/tuần ={" "}
                                {(newEnrollmentData.customWeeks || 0) *
                                  newEnrollmentData.frequency}{" "}
                                buổi
                              </p>
                            </div>
                          )}

                        {/* Cycle */}
                        {newEnrollmentData.courseId &&
                          newEnrollmentData.frequency && (
                            <div>
                              <label
                                className="block text-sm font-medium mb-1"
                                style={{ color: colors.darkBrown }}
                              >
                                Chu kỳ đếm số buổi (tùy chọn)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="12"
                                value={newEnrollmentData.cycle || ""}
                                onChange={(e) =>
                                  setNewEnrollmentData({
                                    ...newEnrollmentData,
                                    cycle: e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  })
                                }
                                placeholder="Ví dụ: 4, 6 (để trống = đếm 1-12)"
                                className="w-full px-3 py-2 border rounded"
                                style={{ borderColor: colors.brown }}
                              />
                              <p
                                className="text-xs mt-1"
                                style={{ color: colors.brown }}
                              >
                                Nếu có chu kỳ, số buổi sẽ đếm lặp lại:
                                1,2,3,4,1,2,3,4... (chu kỳ 4) hoặc
                                1,2,3,4,5,6,1,2,3,4,5,6... (chu kỳ 6). Để trống
                                sẽ đếm 1-12 bình thường.
                              </p>
                            </div>
                          )}

                        {newEnrollmentData.courseId &&
                          newEnrollmentData.frequency && (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (
                                    !newEnrollmentData.courseId ||
                                    !newEnrollmentData.startDate
                                  ) {
                                    alert("Vui lòng điền đầy đủ thông tin");
                                    return;
                                  }
                                  if (
                                    newEnrollmentData.paymentMode ===
                                      "custom" &&
                                    !newEnrollmentData.customWeeks
                                  ) {
                                    alert(
                                      "Vui lòng nhập số tuần cho chế độ tùy chỉnh"
                                    );
                                    return;
                                  }
                                  try {
                                    await onCreateEnrollment(
                                      student._id!.toString(),
                                      {
                                        courseId: newEnrollmentData.courseId as unknown as ObjectId,
                                        frequency: newEnrollmentData.frequency,
                                        startDate: new Date(newEnrollmentData.startDate),
                                        cycle: newEnrollmentData.cycle,
                                        paymentMode:
                                          newEnrollmentData.paymentMode,
                                        customWeeks:
                                          newEnrollmentData.paymentMode ===
                                          "custom"
                                            ? newEnrollmentData.customWeeks
                                            : undefined,
                                        schedule: { sessions: [] },
                                      }
                                    );
                                    setShowCreateEnrollment(false);
                                    setNewEnrollmentData({
                                      courseId: "",
                                      frequency: 1,
                                      startDate: new Date()
                                        .toISOString()
                                        .split("T")[0],
                                      cycle: undefined,
                                      paymentMode: "default",
                                      customWeeks: undefined,
                                    });
                                    await fetchData();
                                  } catch (error) {
                                    const errorMessage =
                                      error instanceof Error
                                        ? error.message
                                        : "Có lỗi xảy ra khi tạo khóa học";
                                    alert(errorMessage);
                                  }
                                }}
                                className="px-4 py-2 rounded text-white"
                                style={{ backgroundColor: colors.mediumGreen }}
                              >
                                Tạo khóa học
                              </button>
                              <button
                                onClick={() => {
                                  setShowCreateEnrollment(false);
                                  setNewEnrollmentData({
                                    courseId: "",
                                    frequency: 1,
                                    startDate: new Date()
                                      .toISOString()
                                      .split("T")[0],
                                    cycle: undefined,
                                    paymentMode: "default",
                                    customWeeks: undefined,
                                  });
                                }}
                                className="px-4 py-2 rounded"
                                style={{
                                  backgroundColor: colors.light,
                                  color: colors.darkBrown,
                                }}
                              >
                                Hủy
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                enrollments.map((enrollment) => {
                  const course = courses.find(
                    (c) => c._id?.toString() === enrollment.courseId.toString()
                  );
                  return (
                    <div
                      key={enrollment._id?.toString()}
                      className="border rounded p-4"
                      style={{ borderColor: colors.brown }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4
                            className="font-semibold"
                            style={{ color: colors.darkBrown }}
                          >
                            {course?.name || "Không xác định"}
                          </h4>
                          <p
                            className="text-sm"
                            style={{ color: colors.brown }}
                          >
                            Trạng thái: {enrollment.status}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span style={{ color: colors.darkBrown }}>
                            Ngày bắt đầu:{" "}
                          </span>
                          {editingField === `startDate-${enrollment._id}` ? (
                            <div className="flex gap-2 mt-1">
                              <input
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-2 py-1 border rounded"
                                style={{ borderColor: colors.brown }}
                              />
                              <button
                                onClick={async () => {
                                  await onUpdateEnrollment(
                                    enrollment._id!.toString(),
                                    {
                                      startDate: new Date(editValue),
                                    }
                                  );
                                  setEditingField(null);
                                  await fetchData();
                                }}
                                className="px-2 py-1 rounded text-white text-xs"
                                style={{ backgroundColor: colors.mediumGreen }}
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setEditingField(null)}
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor: colors.light,
                                  color: colors.darkBrown,
                                }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <span style={{ color: colors.brown }}>
                                {new Date(
                                  enrollment.startDate
                                ).toLocaleDateString("vi-VN")}
                              </span>
                              <button
                                onClick={() =>
                                  handleEditField(
                                    `startDate-${enrollment._id}`,
                                    new Date(enrollment.startDate)
                                      .toISOString()
                                      .split("T")[0]
                                  )
                                }
                                className="text-xs px-2 py-1 rounded"
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
                          <span style={{ color: colors.darkBrown }}>
                            Ngày kết thúc:{" "}
                          </span>
                          <span style={{ color: colors.brown }}>
                            {new Date(enrollment.endDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: colors.darkBrown }}>
                            Tần suất:{" "}
                          </span>
                          <div className="flex gap-2 items-center">
                            <span style={{ color: colors.brown }}>
                              {enrollment.frequency} buổi/tuần
                            </span>
                            <button
                              onClick={() => {
                                setSelectedEnrollmentForFrequency(enrollment);
                                setNewFrequency(
                                  enrollment.frequency === 1 ? 2 : 1
                                );
                                setSelectedClassToAdd("");
                                setSelectedClassToRemove("");
                                setShowFrequencyModal(true);
                              }}
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                backgroundColor: colors.lightGreen,
                                color: colors.darkBrown,
                              }}
                            >
                              Đổi tần suất
                            </button>
                          </div>
                        </div>
                        <div>
                          <span style={{ color: colors.darkBrown }}>
                            Chế độ tính tiền:{" "}
                          </span>
                          {editingField === `paymentMode-${enrollment._id}` ? (
                            <div className="flex gap-2 mt-1">
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-2 py-1 border rounded"
                                style={{ borderColor: colors.brown }}
                              >
                                <option value="default">
                                  Mặc định: 9/18 tuần cho 12 buổi
                                </option>
                                <option value="custom">
                                  Tùy chỉnh: Số tuần × Tần suất = Số buổi
                                </option>
                              </select>
                              <button
                                onClick={async () => {
                                  await onUpdateEnrollment(
                                    enrollment._id!.toString(),
                                    {
                                      paymentMode: editValue as
                                        | "default"
                                        | "custom",
                                      customWeeks:
                                        editValue === "custom"
                                          ? enrollment.customWeeks
                                          : undefined,
                                    }
                                  );
                                  setEditingField(null);
                                  await fetchData();
                                }}
                                className="px-2 py-1 rounded text-white text-xs"
                                style={{ backgroundColor: colors.mediumGreen }}
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setEditingField(null)}
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor: colors.light,
                                  color: colors.darkBrown,
                                }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <span style={{ color: colors.brown }}>
                                {enrollment.paymentMode === "custom"
                                  ? `Tùy chỉnh: ${
                                      enrollment.customWeeks || "?"
                                    } tuần × ${enrollment.frequency} = ${
                                      enrollment.totalSessions || "?"
                                    } buổi`
                                  : "Mặc định: 9/18 tuần cho 12 buổi"}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingField(
                                    `paymentMode-${enrollment._id}`
                                  );
                                  setEditValue(
                                    enrollment.paymentMode || "default"
                                  );
                                }}
                                className="text-xs px-2 py-1 rounded"
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
                        {enrollment.paymentMode === "custom" && (
                          <div>
                            <span style={{ color: colors.darkBrown }}>
                              Số tuần:{" "}
                            </span>
                            {editingField ===
                            `customWeeks-${enrollment._id}` ? (
                              <div className="flex gap-2 mt-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="52"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="px-2 py-1 border rounded w-32"
                                  style={{ borderColor: colors.brown }}
                                />
                                <button
                                  onClick={async () => {
                                    const weeks = parseInt(editValue);
                                    if (!weeks || weeks < 1) {
                                      alert("Số tuần phải lớn hơn 0");
                                      return;
                                    }
                                    await onUpdateEnrollment(
                                      enrollment._id!.toString(),
                                      {
                                        customWeeks: weeks,
                                        totalSessions:
                                          weeks * enrollment.frequency,
                                      }
                                    );
                                    setEditingField(null);
                                    await fetchData();
                                  }}
                                  className="px-2 py-1 rounded text-white text-xs"
                                  style={{
                                    backgroundColor: colors.mediumGreen,
                                  }}
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={() => setEditingField(null)}
                                  className="px-2 py-1 rounded text-xs"
                                  style={{
                                    backgroundColor: colors.light,
                                    color: colors.darkBrown,
                                  }}
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <span style={{ color: colors.brown }}>
                                  {enrollment.customWeeks || "Chưa có"}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingField(
                                      `customWeeks-${enrollment._id}`
                                    );
                                    setEditValue(
                                      enrollment.customWeeks?.toString() || ""
                                    );
                                  }}
                                  className="text-xs px-2 py-1 rounded"
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
                        )}
                        <div>
                          <span style={{ color: colors.darkBrown }}>
                            Chu kỳ:{" "}
                          </span>
                          {editingField === `cycle-${enrollment._id}` ? (
                            <div className="flex gap-2 mt-1">
                              <input
                                type="number"
                                min="1"
                                max="12"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Để trống = đếm 1-12"
                                className="px-2 py-1 border rounded w-32"
                                style={{ borderColor: colors.brown }}
                              />
                              <button
                                onClick={async () => {
                                  await onUpdateEnrollment(
                                    enrollment._id!.toString(),
                                    {
                                      cycle: editValue
                                        ? parseInt(editValue)
                                        : undefined,
                                    }
                                  );
                                  setEditingField(null);
                                  await fetchData();
                                }}
                                className="px-2 py-1 rounded text-white text-xs"
                                style={{ backgroundColor: colors.mediumGreen }}
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setEditingField(null)}
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor: colors.light,
                                  color: colors.darkBrown,
                                }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <span style={{ color: colors.brown }}>
                                {enrollment.cycle
                                  ? `${enrollment.cycle} (1-${enrollment.cycle} lặp lại)`
                                  : "Không có (đếm 1-12)"}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingField(`cycle-${enrollment._id}`);
                                  setEditValue(
                                    enrollment.cycle?.toString() || ""
                                  );
                                }}
                                className="text-xs px-2 py-1 rounded"
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
                          <span style={{ color: colors.darkBrown }}>
                            Đã học:{" "}
                          </span>
                          {editingField ===
                          `completedSessions-${enrollment._id}` ? (
                            <div className="flex gap-2 items-center">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="border rounded px-2 py-1 w-20"
                                min={0}
                                max={
                                  enrollment.completedSessions +
                                  enrollment.remainingSessions
                                }
                              />
                              <span style={{ color: colors.brown }}>
                                /
                                {enrollment.completedSessions +
                                  enrollment.remainingSessions}{" "}
                                buổi
                              </span>
                              <button
                                onClick={handleSaveField}
                                className="px-2 py-1 rounded text-xs text-white"
                                style={{ backgroundColor: colors.mediumGreen }}
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setEditingField(null)}
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor: colors.light,
                                  color: colors.darkBrown,
                                }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <span style={{ color: colors.brown }}>
                                {(() => {
                                  // Count actual attendance records (only 'present' and 'makeup' status)
                                  // Only count past attendances (sessionDate <= today)
                                  const now = new Date();
                                  now.setHours(0, 0, 0, 0);
                                  const actualCompleted = attendance.filter(
                                    (att) => {
                                      if (
                                        att.enrollmentId?.toString() !==
                                        enrollment._id?.toString()
                                      )
                                        return false;
                                      if (
                                        att.status !== "present" &&
                                        att.status !== "makeup"
                                      )
                                        return false;
                                      const attDate = new Date(att.sessionDate);
                                      attDate.setHours(0, 0, 0, 0);
                                      return attDate <= now; // Only count past attendances
                                    }
                                  ).length;
                                  const total =
                                    enrollment.completedSessions +
                                    enrollment.remainingSessions;
                                  return `${actualCompleted}/${total} buổi`;
                                })()}
                              </span>
                              <button
                                onClick={() =>
                                  handleEditField(
                                    `completedSessions-${enrollment._id}`,
                                    (() => {
                                      // Count actual attendance records (only past attendances)
                                      const now = new Date();
                                      now.setHours(0, 0, 0, 0);
                                      const actualCompleted = attendance.filter(
                                        (att) => {
                                          if (
                                            att.enrollmentId?.toString() !==
                                            enrollment._id?.toString()
                                          )
                                            return false;
                                          if (
                                            att.status !== "present" &&
                                            att.status !== "makeup"
                                          )
                                            return false;
                                          const attDate = new Date(
                                            att.sessionDate
                                          );
                                          attDate.setHours(0, 0, 0, 0);
                                          return attDate <= now; // Only count past attendances
                                        }
                                      ).length;
                                      return actualCompleted.toString();
                                    })()
                                  )
                                }
                                className="text-xs px-2 py-1 rounded"
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
                        {/* Bonus Sessions/Weeks, Deferral, and Renew */}
                        <div
                          className="mt-4 pt-4 border-t"
                          style={{ borderColor: colors.brown }}
                        >
                          <div className="flex gap-2 items-center mb-2 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedEnrollmentForBonus(
                                  enrollment._id!.toString()
                                );
                                setShowBonusModal(true);
                                setBonusSessions("");
                                setBonusWeeks("");
                              }}
                              className="px-3 py-1.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: colors.mediumGreen }}
                            >
                              Tặng thêm buổi/tuần
                            </button>
                            {!enrollment.deferralWeeks ||
                            enrollment.deferralWeeks === 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedEnrollmentForDeferral(
                                    enrollment._id!.toString()
                                  );
                                  setDeferralWeeks("");
                                  setShowDeferralModal(true);
                                }}
                                className="px-3 py-1.5 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: "#F59E0B" }}
                              >
                                Bảo lưu
                              </button>
                            ) : (
                              <div
                                className="px-3 py-1.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: colors.light,
                                  color: colors.darkBrown,
                                }}
                              >
                                Đã bảo lưu {enrollment.deferralWeeks} tuần
                              </div>
                            )}
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Bạn có chắc muốn gia hạn khóa học này? Khóa học mới sẽ bắt đầu sau ngày kết thúc của khóa học hiện tại."
                                  )
                                ) {
                                  try {
                                    const response = await fetch(
                                      `/api/enrollments/${enrollment._id}/renew`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                      }
                                    );
                                    if (response.ok) {
                                      alert("Đã gia hạn khóa học thành công!");
                                      await fetchData();
                                    } else {
                                      const error = await response.json();
                                      alert(
                                        error.error ||
                                          "Có lỗi xảy ra khi gia hạn khóa học"
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error renewing enrollment:",
                                      error
                                    );
                                    alert("Có lỗi xảy ra khi gia hạn khóa học");
                                  }
                                }
                              }}
                              className="px-3 py-1.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: "#3B82F6" }}
                            >
                              Gia hạn khóa học
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Frequency Change Modal */}
          {showFrequencyModal && selectedEnrollmentForFrequency && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[100]"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
              <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                style={{ backgroundColor: colors.light }}
              >
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.darkBrown }}
                >
                  Thay đổi tần suất học
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: colors.darkBrown }}
                    >
                      Tần suất hiện tại:{" "}
                      {selectedEnrollmentForFrequency.frequency} buổi/tuần
                    </label>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: colors.darkBrown }}
                    >
                      Tần suất mới:
                    </label>
                    <select
                      value={newFrequency}
                      onChange={(e) =>
                        setNewFrequency(parseInt(e.target.value) as 1 | 2)
                      }
                      className="w-full px-3 py-2 border rounded"
                      style={{ borderColor: colors.brown }}
                    >
                      <option value={1}>1 buổi/tuần</option>
                      <option value={2}>2 buổi/tuần</option>
                    </select>
                  </div>

                  {/* If changing from 1 to 2: need to select a second class */}
                  {selectedEnrollmentForFrequency.frequency === 1 &&
                    newFrequency === 2 && (
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: colors.darkBrown }}
                        >
                          Chọn lớp thứ 2 *
                        </label>
                        <select
                          value={selectedClassToAdd}
                          onChange={(e) =>
                            setSelectedClassToAdd(e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded"
                          style={{ borderColor: colors.brown }}
                          required
                        >
                          <option value="">-- Chọn lớp --</option>
                          {classes
                            .filter((cls) => {
                              // courseId no longer exists on Class, so skip that filter
                              // Don't show classes student is already in
                              const currentClassIds =
                                selectedEnrollmentForFrequency.schedule?.sessions
                                  .map((s) => s.classId?.toString())
                                  .filter(Boolean) || [];
                              if (currentClassIds.includes(cls._id?.toString()))
                                return false;
                              // Only show active classes with available slots
                              if (!cls.isActive) return false;
                              if (
                                false // maxStudents no longer exists
                              )
                                return false;
                              return true;
                            })
                            .map((cls) => (
                              <option
                                key={cls._id?.toString()}
                                value={cls._id?.toString()}
                              >
                                {cls.name} ({cls.enrolledStudents.length}/
                                học viên)
                              </option>
                            ))}
                        </select>
                        {classes.filter((cls) => {
                          // courseId no longer exists on Class, so skip that filter
                          // if (
                          //   cls.courseId.toString() !==
                          //   selectedEnrollmentForFrequency.courseId.toString()
                          // )
                          //   return false;
                          const currentClassIds =
                            selectedEnrollmentForFrequency.schedule?.sessions
                              .map((s) => s.classId?.toString())
                              .filter(Boolean) || [];
                          if (currentClassIds.includes(cls._id?.toString()))
                            return false;
                          if (!cls.isActive) return false;
                          // maxStudents no longer exists, so skip this check
                          // if (cls.enrolledStudents.length >= cls.maxStudents)
                          //   return false;
                          return true;
                        }).length === 0 && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#DC2626" }}
                          >
                            Không có lớp nào khả dụng. Vui lòng tạo lớp mới hoặc
                            chọn lớp khác.
                          </p>
                        )}
                      </div>
                    )}

                  {/* If changing from 2 to 1: need to select which class to remove */}
                  {selectedEnrollmentForFrequency.frequency === 2 &&
                    newFrequency === 1 && (
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: colors.darkBrown }}
                        >
                          Chọn lớp sẽ gỡ học viên ra *
                        </label>
                        <select
                          value={selectedClassToRemove}
                          onChange={(e) =>
                            setSelectedClassToRemove(e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded"
                          style={{ borderColor: colors.brown }}
                          required
                        >
                          <option value="">-- Chọn lớp --</option>
                          {selectedEnrollmentForFrequency.schedule?.sessions
                            .filter((s) => s.classId)
                            .map((session) => {
                              const cls = classes.find(
                                (c) =>
                                  c._id?.toString() ===
                                  session.classId?.toString()
                              );
                              if (!cls) return null;
                              return (
                                <option
                                  key={session.classId?.toString()}
                                  value={session.classId?.toString()}
                                >
                                  {cls.name} ({cls.enrolledStudents.length}/
                                  học viên)
                                </option>
                              );
                            })
                            .filter(Boolean)}
                        </select>
                      </div>
                    )}
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={async () => {
                      // Validation
                      if (
                        selectedEnrollmentForFrequency.frequency === 1 &&
                        newFrequency === 2 &&
                        !selectedClassToAdd
                      ) {
                        alert("Vui lòng chọn lớp thứ 2");
                        return;
                      }
                      if (
                        selectedEnrollmentForFrequency.frequency === 2 &&
                        newFrequency === 1 &&
                        !selectedClassToRemove
                      ) {
                        alert("Vui lòng chọn lớp sẽ gỡ học viên ra");
                        return;
                      }

                      try {
                        // Build new schedule sessions
                        let newSessions = [
                          ...(selectedEnrollmentForFrequency.schedule
                            ?.sessions || []),
                        ];

                        if (
                          selectedEnrollmentForFrequency.frequency === 1 &&
                          newFrequency === 2
                        ) {
                          // Add new class
                          const newClass = classes.find(
                            (c) => c._id?.toString() === selectedClassToAdd
                          );
                          if (!newClass) {
                            alert("Lớp không tồn tại");
                            return;
                          }

                          const firstSession = newClass.sessions && newClass.sessions.length > 0 
                            ? newClass.sessions[0] 
                            : null;
                          const timeSlot = firstSession
                              ? `${firstSession.startTime}-${firstSession.endTime}`
                              : "";

                          newSessions.push({
                            dayOfWeek:
                              firstSession?.dayOfWeek ?? new Date().getDay(),
                            timeSlot,
                            classId: newClass._id?.toString() as unknown as ObjectId,
                          });

                          // Add student to new class
                          await onAddToClass(
                            selectedClassToAdd,
                            student._id!.toString()
                          );
                        } else if (
                          selectedEnrollmentForFrequency.frequency === 2 &&
                          newFrequency === 1
                        ) {
                          // Remove selected class
                          newSessions = newSessions.filter(
                            (s) =>
                              s.classId?.toString() !== selectedClassToRemove
                          );

                          // Remove student from class
                          await onRemoveFromClass(
                            selectedClassToRemove,
                            student._id!.toString()
                          );
                        }

                        // Update enrollment with new frequency and schedule
                        await onUpdateEnrollment(
                          selectedEnrollmentForFrequency._id!.toString(),
                          {
                            frequency: newFrequency,
                            schedule: { sessions: newSessions },
                          }
                        );

                        alert("Đã thay đổi tần suất học thành công!");
                        setShowFrequencyModal(false);
                        setSelectedEnrollmentForFrequency(null);
                        setSelectedClassToAdd("");
                        setSelectedClassToRemove("");
                        await fetchData();
                      } catch (error) {
                        console.error("Error changing frequency:", error);
                        alert("Có lỗi xảy ra khi thay đổi tần suất");
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: colors.mediumGreen }}
                  >
                    Xác nhận
                  </button>
                  <button
                    onClick={() => {
                      setShowFrequencyModal(false);
                      setSelectedEnrollmentForFrequency(null);
                      setSelectedClassToAdd("");
                      setSelectedClassToRemove("");
                    }}
                    className="flex-1 px-4 py-2 rounded font-medium"
                    style={{
                      backgroundColor: colors.light,
                      color: colors.darkBrown,
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Deferral Modal */}
          {showDeferralModal && selectedEnrollmentForDeferral && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[100]"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
              <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                style={{ backgroundColor: colors.light }}
              >
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.darkBrown }}
                >
                  Bảo lưu khóa học
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: colors.darkBrown }}
                    >
                      Số tuần bảo lưu (1-4 tuần) *
                    </label>
                    <input
                      type="number"
                      value={deferralWeeks}
                      onChange={(e) => setDeferralWeeks(e.target.value)}
                      placeholder="Nhập số tuần (1-4)"
                      min="1"
                      max="4"
                      className="w-full px-3 py-2 border rounded"
                      style={{ borderColor: colors.brown }}
                    />
                    <p className="text-xs mt-1" style={{ color: colors.brown }}>
                      Trong thời gian bảo lưu, học viên sẽ không đi học và các
                      lớp sẽ được tính là vắng có phép. Thời gian kết thúc khóa
                      học sẽ được kéo dài thêm số tuần bảo lưu.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={async () => {
                      const weeks = parseInt(deferralWeeks);

                      if (!weeks || weeks < 1 || weeks > 4) {
                        alert("Vui lòng nhập số tuần từ 1 đến 4");
                        return;
                      }

                      try {
                        const response = await fetch(
                          `/api/enrollments/${selectedEnrollmentForDeferral}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              deferralWeeks: weeks,
                            }),
                          }
                        );

                        if (response.ok) {
                          alert(`Đã bảo lưu ${weeks} tuần thành công!`);
                          setShowDeferralModal(false);
                          setSelectedEnrollmentForDeferral(null);
                          setDeferralWeeks("");
                          await fetchData();
                        } else {
                          const error = await response.json();
                          alert(error.error || "Có lỗi xảy ra");
                        }
                      } catch (error) {
                        console.error("Error deferring enrollment:", error);
                        alert("Có lỗi xảy ra");
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    Xác nhận
                  </button>
                  <button
                    onClick={() => {
                      setShowDeferralModal(false);
                      setSelectedEnrollmentForDeferral(null);
                      setDeferralWeeks("");
                    }}
                    className="flex-1 px-4 py-2 rounded font-medium"
                    style={{
                      backgroundColor: colors.light,
                      color: colors.darkBrown,
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bonus Modal */}
          {showBonusModal && selectedEnrollmentForBonus && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[100]"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
              <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                style={{ backgroundColor: colors.light }}
              >
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.darkBrown }}
                >
                  Tặng thêm buổi/tuần
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: colors.darkBrown }}
                    >
                      Số buổi tặng thêm
                    </label>
                    <input
                      type="number"
                      value={bonusSessions}
                      onChange={(e) => setBonusSessions(e.target.value)}
                      placeholder="Nhập số buổi (ví dụ: 2)"
                      min="0"
                      className="w-full px-3 py-2 border rounded"
                      style={{ borderColor: colors.brown }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: colors.darkBrown }}
                    >
                      Số tuần tặng thêm
                    </label>
                    <input
                      type="number"
                      value={bonusWeeks}
                      onChange={(e) => setBonusWeeks(e.target.value)}
                      placeholder="Nhập số tuần (ví dụ: 1)"
                      min="0"
                      className="w-full px-3 py-2 border rounded"
                      style={{ borderColor: colors.brown }}
                    />
                    <p className="text-xs mt-1" style={{ color: colors.brown }}>
                      Lưu ý: Số tuần chỉ tăng thêm thời gian để sắp xếp
                      học/nghỉ/học bù, không tăng số buổi học. Chỉ số buổi mới
                      quyết định số buổi học được tặng thêm.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={async () => {
                      const sessions = parseInt(bonusSessions) || 0;
                      const weeks = parseInt(bonusWeeks) || 0;

                      if (sessions === 0 && weeks === 0) {
                        alert("Vui lòng nhập ít nhất một giá trị");
                        return;
                      }

                      try {
                        const response = await fetch(
                          `/api/enrollments/${selectedEnrollmentForBonus}/bonus`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              bonusSessions: sessions,
                              bonusWeeks: weeks,
                            }),
                          }
                        );

                        if (response.ok) {
                          alert("Đã tặng thêm thành công!");
                          setShowBonusModal(false);
                          setSelectedEnrollmentForBonus(null);
                          setBonusSessions("");
                          setBonusWeeks("");
                          await fetchData();
                        } else {
                          const error = await response.json();
                          alert(error.error || "Có lỗi xảy ra");
                        }
                      } catch (error) {
                        console.error("Error adding bonus:", error);
                        alert("Có lỗi xảy ra");
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: colors.mediumGreen }}
                  >
                    Xác nhận
                  </button>
                  <button
                    onClick={() => {
                      setShowBonusModal(false);
                      setSelectedEnrollmentForBonus(null);
                      setBonusSessions("");
                      setBonusWeeks("");
                    }}
                    className="flex-1 px-4 py-2 rounded font-medium"
                    style={{
                      backgroundColor: colors.light,
                      color: colors.darkBrown,
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

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
                              {cls.name} • {cls.enrolledStudents.length} học viên
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
                              {cls.name} • {cls.enrolledStudents.length} học viên
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
