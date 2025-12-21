"use client";

import React, { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { MakeupRequest } from "@/models/MakeupRequest";
import { calculateSessionNumber } from "@/app/utils/sessionNumberCalculator";

// Color palette
const colors = {
  light: "#F0EAD2", // Light beige
  lightGreen: "#DDE5B6", // Light green
  mediumGreen: "#ADC178", // Medium green
  brown: "#A98467", // Brown
  darkBrown: "#6C584C", // Dark brown
};

export default function TeacherOverviewPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [makeupRequests, setMakeupRequests] = useState<MakeupRequest[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Map<string, { studentNumber?: number; note?: string }>>(new Map());
  const [saving, setSaving] = useState(false);

  // Fetch data only once on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all students directly
      const studentsRes = await fetch("/api/students");
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      // Fetch all enrollments (for reference, but not required for display)
      const enrollmentsRes = await fetch("/api/enrollments");
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        setEnrollments(enrollmentsData);
      }

      // Fetch all attendance records - this is the key data
      const attendanceRes = await fetch("/api/attendance");
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendanceRecords(attendanceData);
      }

      // Fetch all makeup requests
      const makeupsRes = await fetch("/api/makeups");
      if (makeupsRes.ok) {
        const makeupsData = await makeupsRes.json();
        setMakeupRequests(makeupsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get two weeks dates (Sunday to Saturday, 2 weeks = 14 days)
  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 14; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(currentDate);
  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // Get attendance info for a student on a specific date
  // const getAttendanceInfo = (student: User, date: Date) => {
  //   const now = new Date();
  //   now.setHours(0, 0, 0, 0);
  //   const checkDate = new Date(date);
  //   checkDate.setHours(0, 0, 0, 0);

  //   // Get all attendance records for this student, sorted by date
  //   // Count ALL attendances (both regular and makeup) in chronological order
  //   const studentAttendances = attendanceRecords
  //     .filter((att) => att.studentId.toString() === student._id?.toString())
  //     .filter((att) => {
  //       const attDate = new Date(att.sessionDate);
  //       attDate.setHours(0, 0, 0, 0);
  //       return attDate <= now; // Only count past attendances
  //     })
  //     .sort((a, b) => {
  //       const dateA = new Date(a.sessionDate).getTime();
  //       const dateB = new Date(b.sessionDate).getTime();
  //       return dateA - dateB;
  //     });

  //   // Find attendance for this specific date
  //   const attendanceForDate = studentAttendances.find((att) => {
  //     const attDate = new Date(att.sessionDate);
  //     attDate.setHours(0, 0, 0, 0);
  //     return attDate.getTime() === checkDate.getTime();
  //   });

  //   if (!attendanceForDate) {
  //     return null;
  //   }

  //   // Calculate session number (which session is this?)
  //   // Get enrollment to access cycle and totalSessions
  //   const studentEnrollment = enrollments.find(
  //     (e) => e.studentId.toString() === student._id?.toString()
  //   );

  //   if (!studentEnrollment) {
  //     // Fallback: count chronologically if no enrollment
  //     const sessionNumber =
  //       studentAttendances.findIndex(
  //         (att) => att._id?.toString() === attendanceForDate._id?.toString()
  //       ) + 1;
  //     return {
  //       sessionNumber,
  //       isRegular: false,
  //       isMakeup: false,
  //       hasAttendance: true,
  //     };
  //   }

  //   // Calculate which session number this is based on actual attendance count
  //   // Count how many attendances happened before or on this date (chronologically)
  //   // This gives us the actual session number (1, 2, 3, 4, 5, 6, 7, 8...)
  //   const sessionIndex = studentAttendances.findIndex(
  //     (att) => att._id?.toString() === attendanceForDate._id?.toString()
  //   );
  //   const actualSessionNumber = sessionIndex + 1; // 1-indexed (1, 2, 3, 4, 5, 6, 7, 8...)

  //   // Use calculateSessionNumber with cycle to format the display
  //   // If cycle = 4, it will display: 1/4, 2/4, 3/4, 4/4, 1/4, 2/4, 3/4, 4/4...
  //   const totalSessions =
  //     (studentEnrollment.completedSessions || 0) +
  //     (studentEnrollment.remainingSessions || 0) ||
  //     studentEnrollment.totalSessions ||
  //     12;

  //   const sessionNumber = calculateSessionNumber(
  //     actualSessionNumber,
  //     studentEnrollment.cycle,
  //     totalSessions
  //   );

  //   // Check if this is a regular class or makeup
  //   const isMakeup =
  //     attendanceForDate.status === "makeup" ||
  //     makeupRequests.some((makeup) => {
  //       if (makeup.studentId.toString() !== student._id?.toString())
  //         return false;
  //       if (makeup.status !== "approved") return false;
  //       const makeupDate = new Date(makeup.newSessionDate);
  //       makeupDate.setHours(0, 0, 0, 0);
  //       return makeupDate.getTime() === checkDate.getTime();
  //     });

  //   // Check if it's a regular scheduled class
  //   // Note: studentEnrollment is already declared above
  //   let isRegular = false;
  //   if (
  //     studentEnrollment &&
  //     studentEnrollment.schedule?.sessions &&
  //     attendanceForDate.classId
  //   ) {
  //     const dayOfWeek = date.getDay();
  //     isRegular = studentEnrollment.schedule.sessions.some(
  //       (session) =>
  //         session.dayOfWeek === dayOfWeek &&
  //         session.classId?.toString() === attendanceForDate.classId?.toString()
  //     );
  //   }

  //   return {
  //     sessionNumber,
  //     isRegular: isRegular && !isMakeup,
  //     isMakeup,
  //     hasAttendance: true,
  //   };
  // };

  // Check if date is a scheduled class day (for highlighting)
  // Only within enrollment period (startDate to endDate)
  const isScheduledClassDay = (student: User, date: Date): boolean => {
    const studentEnrollment = enrollments.find(
      (e) => e.studentId.toString() === student._id?.toString()
    );
    if (!studentEnrollment || !studentEnrollment.schedule?.sessions)
      return false;

    // Check if date is within enrollment period FIRST
    const enrollmentStart = new Date(studentEnrollment.startDate);
    enrollmentStart.setHours(0, 0, 0, 0);
    const enrollmentEnd = new Date(studentEnrollment.endDate);
    enrollmentEnd.setHours(23, 59, 59, 999);

    if (date < enrollmentStart || date > enrollmentEnd) return false;

    // Then check if it's a scheduled class day
    const dayOfWeek = date.getDay();
    const hasScheduledClass = studentEnrollment.schedule.sessions.some(
      (session) => session.dayOfWeek === dayOfWeek
    );

    return hasScheduledClass;
  };

  // Check if date is enrollment start date
  const isEnrollmentStartDate = (student: User, date: Date): boolean => {
    const studentEnrollment = enrollments.find(
      (e) => e.studentId.toString() === student._id?.toString()
    );
    if (!studentEnrollment) return false;

    const startDate = new Date(studentEnrollment.startDate);
    startDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return startDate.getTime() === checkDate.getTime();
  };

  // Get attendance status for a student on a specific date
  // Returns: 'present' | 'absent' | null (null = chưa điểm danh)
  const getAttendanceStatus = (student: User, date: Date): 'present' | 'absent' | null => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const attendanceForDate = attendanceRecords.find((att) => {
      if (att.studentId.toString() !== student._id?.toString()) return false;
      const attDate = new Date(att.sessionDate);
      attDate.setHours(0, 0, 0, 0);
      return attDate.getTime() === checkDate.getTime();
    });

    if (!attendanceForDate) {
      return null; // Chưa điểm danh
    }

    // Check status
    if (attendanceForDate.status === 'present' || attendanceForDate.status === 'makeup') {
      return 'present'; // Đã đi học
    } else if (attendanceForDate.status === 'absent') {
      return 'absent'; // Vắng
    }

    return null; // Chưa điểm danh
  };

  // Get attendance progress for a student (completed / total)
  // const getAttendanceProgress = (
  //   student: User
  // ): { completed: number; total: number } => {
  //   const studentEnrollment = enrollments.find(
  //     (e) => e.studentId.toString() === student._id?.toString()
  //   );

  //   if (!studentEnrollment) {
  //     return { completed: 0, total: 0 };
  //   }

  //   // Calculate completed sessions from attendance records
  //   // Only count 'present' and 'makeup' status (actual attended sessions)
  //   const now = new Date();
  //   now.setHours(0, 0, 0, 0);
  //   const completed = attendanceRecords.filter((att) => {
  //     if (att.studentId.toString() !== student._id?.toString()) return false;
  //     // Only count 'present' and 'makeup' - actual attended sessions
  //     if (att.status !== "present" && att.status !== "makeup") return false;
  //     const attDate = new Date(att.sessionDate);
  //     attDate.setHours(0, 0, 0, 0);
  //     return attDate <= now; // Only count past attendances
  //   }).length;

  //   // Total sessions = completedSessions + remainingSessions from enrollment
  //   const total =
  //     (studentEnrollment.completedSessions || 0) +
  //     (studentEnrollment.remainingSessions || 0);

  //   // Fallback: if total is 0, use default 12 sessions
  //   const finalTotal = total > 0 ? total : 12;

  //   return { completed, total: finalTotal };
  // };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 14 : -14));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Initialize edit data when entering edit mode
  const handleEnterEditMode = () => {
    const initialEditData = new Map<string, { studentNumber?: number; note?: string }>();
    students.forEach((student) => {
      initialEditData.set(student._id?.toString() || "", {
        studentNumber: student.studentNumber,
        note: student.note || "",
      });
    });
    setEditData(initialEditData);
    setIsEditMode(true);
  };

  // Handle cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditData(new Map());
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const updates = Array.from(editData.entries()).map(([studentId, data]) => ({
        studentId,
        ...data,
      }));

      const response = await fetch("/api/students/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save changes");
      }

      // Refresh data
      await fetchData();
      setIsEditMode(false);
      setEditData(new Map());
      alert("Đã lưu thay đổi thành công!");
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Có lỗi xảy ra khi lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  // Update edit data
  const updateEditData = (studentId: string, field: "studentNumber" | "note", value: number | string) => {
    const newEditData = new Map(editData);
    const current = newEditData.get(studentId) || {};
    newEditData.set(studentId, { ...current, [field]: value });
    setEditData(newEditData);
  };

  // Sort students by studentNumber
  const sortedStudents = [...students].sort((a, b) => {
    const numA = a.studentNumber || 999999;
    const numB = b.studentNumber || 999999;
    return numA - numB;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--page-background)" }}>
        <div className="text-lg" style={{ color: "#6C584C" }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-background)" }}>
      <Navigation />

      <div className="max-w-[90vw] mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#6C584C" }}>
            Tổng Quan Học Viên
          </h1>
          <p className="text-lg" style={{ color: "#A98467" }}>
            Xem lịch học và điểm danh của tất cả học viên
          </p>
        </div>

        {/* Week Navigation */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek("prev")}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md"
              style={{
                backgroundColor: colors.mediumGreen,
                color: "white",
              }}
            >
              ← 2 tuần trước
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md"
              style={{
                backgroundColor: colors.light,
                color: colors.darkBrown,
              }}
            >
              Hôm nay
            </button>
            <button
              onClick={() => navigateWeek("next")}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md"
              style={{
                backgroundColor: colors.mediumGreen,
                color: "white",
              }}
            >
              2 tuần sau →
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="text-lg font-semibold"
              style={{ color: colors.darkBrown }}
            >
              {weekDates[0].toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
              })}{" "}
              -{" "}
              {weekDates[13].toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            {!isEditMode ? (
              <button
                onClick={handleEnterEditMode}
                className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md"
                style={{
                  backgroundColor: colors.brown,
                  color: "white",
                }}
              >
                Chỉnh sửa
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md"
                  style={{
                    backgroundColor: colors.light,
                    color: colors.darkBrown,
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md disabled:opacity-50"
                  style={{
                    backgroundColor: colors.mediumGreen,
                    color: "white",
                  }}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th
                    className="sticky left-0 z-10 p-3 text-center font-semibold border-r border-b"
                    style={{
                      backgroundColor: colors.mediumGreen,
                      color: "white",
                      minWidth: "80px",
                      width: "80px",
                    }}
                  >
                    STT
                  </th>
                  <th
                    className="sticky left-[80px] z-10 p-3 text-left font-semibold border-r border-b"
                    style={{
                      backgroundColor: colors.mediumGreen,
                      color: "white",
                      minWidth: "150px",
                      width: "150px",
                    }}
                  >
                    Học viên
                  </th>
                  {weekDates.map((date, index) => (
                    <th
                      key={index}
                      className="p-3 text-center font-semibold border-b"
                      style={{
                        backgroundColor: colors.mediumGreen,
                        color: "white",
                        minWidth: "90px",
                        width: "90px",
                      }}
                    >
                      <div className="text-sm">{daysOfWeek[date.getDay()]}</div>
                      <div className="text-xs font-normal mt-1">
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="p-8 text-center"
                      style={{ color: colors.brown }}
                    >
                      Chưa có học viên nào
                    </td>
                  </tr>
                ) : (
                  sortedStudents.map((student) => {
                    const studentId = student._id?.toString() || "";
                    const editStudentData = editData.get(studentId);
                    const displayStudentNumber = isEditMode && editStudentData?.studentNumber !== undefined
                      ? editStudentData.studentNumber
                      : student.studentNumber || "";
                    const displayNote = isEditMode && editStudentData?.note !== undefined
                      ? editStudentData.note
                      : student.note || "";

                    return (
                    <tr
                      key={student._id?.toString()}
                      className="hover:bg-gray-50"
                    >
                      {/* STT Column */}
                      <td
                        className="sticky left-0 z-10 p-2 text-center font-medium border-r border-b border-gray-200"
                        style={{
                          backgroundColor: "white",
                          color: colors.darkBrown,
                          minWidth: "80px",
                          width: "80px",
                        }}
                      >
                        {isEditMode ? (
                          <input
                            type="number"
                            value={displayStudentNumber}
                            onChange={(e) =>
                              updateEditData(
                                studentId,
                                "studentNumber",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 text-center border rounded"
                            style={{ borderColor: colors.brown }}
                            min="1"
                          />
                        ) : (
                          <span className="text-sm font-semibold">
                            {student.studentNumber || ""}
                          </span>
                        )}
                      </td>
                      {/* Học viên Column */}
                      <td
                        className="sticky left-[80px] z-10 p-2 font-medium border-r border-b border-gray-200"
                        style={{
                          backgroundColor: "white",
                          color: colors.darkBrown,
                          minWidth: "150px",
                          width: "150px",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: colors.mediumGreen,
                              color: "white",
                            }}
                          >
                            {student.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="truncate text-sm block">
                              {student.fullName}
                            </span>
                            {isEditMode && (
                              <input
                                type="text"
                                value={displayNote}
                                onChange={(e) =>
                                  updateEditData(studentId, "note", e.target.value)
                                }
                                placeholder="Ghi chú..."
                                className="w-full mt-1 px-2 py-1 text-xs border rounded"
                                style={{ borderColor: colors.brown }}
                              />
                            )}
                            {!isEditMode && displayNote && (
                              <span className="text-xs text-gray-500 block mt-1 truncate" title={displayNote}>
                                {displayNote}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {weekDates.map((date, dateIndex) => {
                        const attendanceStatus = getAttendanceStatus(student, date);
                        const isStartDate = isEnrollmentStartDate(student, date);
                        const isScheduled = isScheduledClassDay(student, date);

                        let backgroundColor = "white"; // Trắng mặc định (không có lớp)
                        let borderColor = "#E5E7EB";
                        let textColor = colors.darkBrown;

                        // Priority: Start date (với attendance status) > Attendance status > Scheduled class (chưa điểm danh)
                        if (isStartDate) {
                          // Ngày bắt đầu: màu theo attendance status, nhưng luôn giữ border đỏ và text "Bắt đầu"
                          borderColor = "#DC2626";
                          textColor = "#DC2626";
                          if (attendanceStatus === 'present') {
                            // Đã đi học - xanh lá
                            backgroundColor = colors.lightGreen;
                          } else if (attendanceStatus === 'absent') {
                            // Vắng - đỏ
                            backgroundColor = "#FEE2E2";
                          } else {
                            // Chưa điểm danh - đỏ nhạt
                            backgroundColor = "#FEE2E2";
                          }
                        } else if (attendanceStatus === 'present') {
                          // Đã đi học - xanh
                          backgroundColor = colors.lightGreen;
                          borderColor = colors.mediumGreen;
                        } else if (attendanceStatus === 'absent') {
                          // Vắng - đỏ
                          backgroundColor = "#FEE2E2";
                          borderColor = "#DC2626";
                        } else if (isScheduled) {
                          // Có lớp nhưng chưa điểm danh - xám
                          backgroundColor = "#E5E7EB";
                          borderColor = "#9CA3AF";
                        } else {
                          // Không có lớp - trắng
                          backgroundColor = "white";
                          borderColor = "#E5E7EB";
                        }

                        return (
                          <td
                            key={dateIndex}
                            className="p-1.5 text-center border-b border-r transition-all"
                            style={{
                              backgroundColor,
                              borderColor,
                              color: textColor,
                              minWidth: "90px",
                              width: "90px",
                            }}
                          >
                            {isStartDate && (
                              <div className="text-[10px] font-bold">
                                Bắt đầu
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{
                backgroundColor: "#FEE2E2",
                borderColor: "#DC2626",
              }}
            />
            <span className="text-sm" style={{ color: colors.darkBrown }}>
              Ngày bắt đầu khóa học
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{
                backgroundColor: colors.lightGreen,
                borderColor: colors.mediumGreen,
              }}
            />
            <span className="text-sm" style={{ color: colors.darkBrown }}>
              Đã đi học
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{
                backgroundColor: "#FEE2E2",
                borderColor: "#DC2626",
              }}
            />
            <span className="text-sm" style={{ color: colors.darkBrown }}>
              Vắng
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{
                backgroundColor: "#E5E7EB",
                borderColor: "#9CA3AF",
              }}
            />
            <span className="text-sm" style={{ color: colors.darkBrown }}>
              Có lớp nhưng chưa điểm danh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
