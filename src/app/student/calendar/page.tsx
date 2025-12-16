"use client";

import React, { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import WeekCalendar from "@/app/components/WeekCalendar";
import MakeupRequestModal from "@/app/components/MakeupRequestModal";
import SelectClassesModal from "@/app/components/SelectClassesModal";
import { useAuth } from "@/contexts/AuthContext";
import { Class } from "@/models/Class";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { MakeupRequest } from "@/models/MakeupRequest";
import { Attendance } from "@/models/Attendance";
import { showError, showSuccess } from "@/lib/toast";

export default function StudentCalendarPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [showMakeupModal, setShowMakeupModal] = useState(false);
  const [showSelectClassesModal, setShowSelectClassesModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [makeupRequests, setMakeupRequests] = useState<MakeupRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    Array<{
      sessionDate: Date;
      studentId?: string;
      classId?: string;
      status?: string;
    }>
  >([]);

  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === "student" && user._id) {
      setStudentId(user._id.toString());
      fetchStudentData(user._id.toString());
    }
  }, [user]);

  const fetchStudentData = async (id: string) => {
    try {
      // Fetch all active classes
      const classesResponse = await fetch(`/api/classes?isActive=true`);
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();

        // Filter classes where student is enrolled (studentId is in enrolledStudents)
        // Handle both ObjectId and string formats
        const studentClasses = classesData.filter((cls: Class) => {
          if (!cls.enrolledStudents || cls.enrolledStudents.length === 0) {
            return false;
          }

          return cls.enrolledStudents.some((studentIdObj) => {
            // Handle both ObjectId objects and strings
            const studentIdStr =
              typeof studentIdObj === "string"
                ? studentIdObj
                : studentIdObj?.toString() || "";
            return studentIdStr === id;
          });
        });

        console.log("Student ID:", id);
        console.log("Total classes:", classesData.length);
        console.log("Student classes:", studentClasses.length);
        console.log(
          "Student classes details:",
          studentClasses.map((c: Class) => ({
            name: c.name,
            enrolledStudents: c.enrolledStudents?.map(
              (s: string | { toString(): string }) =>
                typeof s === "string" ? s : s?.toString()
            ),
          }))
        );

        setClasses(studentClasses);

        // If student has classes, fetch enrollment for other features (attendance, makeup)
        if (studentClasses.length > 0) {
          const enrollmentResponse = await fetch(
            `/api/enrollments?studentId=${id}`
          );
          if (enrollmentResponse.ok) {
            const enrollments = await enrollmentResponse.json();
            // Get the most recent active or pending enrollment
            const activeEnrollments = enrollments.filter(
              (e: StudentEnrollment) =>
                e.status === "active" || e.status === "pending"
            );

            if (activeEnrollments.length > 0) {
              const currentEnrollment = activeEnrollments[0];
              setEnrollment(currentEnrollment);

              // No need to fetch absence requests anymore
              // Attendance records with status "excused" are sufficient

              // Fetch makeup requests
              const makeupsResponse = await fetch(
                `/api/makeups?studentId=${id}&enrollmentId=${currentEnrollment._id?.toString()}`
              );
              if (makeupsResponse.ok) {
                const makeups = await makeupsResponse.json();
                setMakeupRequests(makeups);
              }

              // Fetch attendance records
              const attendanceResponse = await fetch(
                `/api/attendance?studentId=${id}&enrollmentId=${currentEnrollment._id?.toString()}`
              );
              if (attendanceResponse.ok) {
                const attendance =
                  (await attendanceResponse.json()) as Attendance[];
                setAttendanceRecords(
                  attendance.map((a) => ({
                    sessionDate: new Date(a.sessionDate),
                    studentId: a.studentId?.toString(),
                    classId: a.classId?.toString(),
                    status: a.status,
                  }))
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date as yyyy-mm-dd in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to check if student has excused absence
  const hasExcusedAbsence = (classId: string, date: Date): boolean => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const checkDateStr = formatDateLocal(checkDate);

    return attendanceRecords.some((att) => {
      if (att.classId !== classId) return false;
      if (att.status !== "excused") return false;
      const attDate = new Date(att.sessionDate);
      attDate.setHours(0, 0, 0, 0);
      const attDateStr = formatDateLocal(attDate);
      return attDateStr === checkDateStr;
    });
  };

  const handleRequestAbsence = async (
    classId: string,
    date: Date,
    reason: string
  ) => {
    if (!enrollment) return;

    // Find the class to get start time
    const cls = classes.find((c) => c._id?.toString() === classId);
    if (!cls) {
      showError("Không tìm thấy lớp học");
      return;
    }

    // Calculate actual class start time from session
    // Find session for this date
    const dayOfWeek = date.getDay();
    const session = cls.sessions?.find((s) => s.dayOfWeek === dayOfWeek);
    if (!session) {
      showError("Không tìm thấy ca học cho ngày này");
      return;
    }

    const classStartTime = new Date(date);
    const [startHour, startMin] = session.startTime.split(":").map(Number);
    classStartTime.setHours(startHour, startMin, 0, 0);

    // Check if request is at least 6 hours before class
    const now = new Date();
    const hoursUntilClass =
      (classStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilClass < 6) {
      showError("Bạn chỉ có thể xin vắng trước 6 tiếng khi buổi học bắt đầu");
      return;
    }

    try {
      const response = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          enrollmentId: enrollment._id?.toString(),
          classId,
          sessionDate: classStartTime.toISOString(),
          reason,
        }),
      });

      if (response.ok) {
        // Only remove student from class if it's NOT a pattern-based class
        // Pattern-based classes should keep student enrolled, only mark absence for specific session
        // All classes are pattern-based (repeat weekly)
        {
          // For instance-based classes (series), remove student from this specific class instance
          const removeResponse = await fetch(
            `/api/classes/${classId}/students?studentId=${studentId}`,
            {
              method: "DELETE",
            }
          );

          if (!removeResponse.ok) {
            showError(
              "Đã gửi yêu cầu xin vắng nhưng có lỗi khi cập nhật lớp học"
            );
          }
        }

        // Refresh data
        await fetchStudentData(studentId);
        showSuccess("Đã gửi yêu cầu xin vắng thành công!");
      } else {
        const error = await response.json();
        showError(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      console.error("Error requesting absence:", error);
      showError("Có lỗi xảy ra khi xin vắng");
    }
  };

  const handleRequestMakeup = async (
    classId: string,
    date: Date,
    remainingMakeupSessionsStr: string // Pass remainingMakeupSessions as string
  ) => {
    // Chỉ check enrollment cơ bản, không validate gì cả
    // Tất cả validation sẽ được làm trong handleSubmitMakeup khi submit
    if (!enrollment) {
      showError("Bạn chưa đăng ký khóa học nào.");
      return;
    }

    // Check if student has remaining makeup sessions
    const remainingMakeupSessions = parseInt(remainingMakeupSessionsStr) || 0;
    if (remainingMakeupSessions <= 0) {
      showError(
        "Bạn không còn buổi học bù nào. Vui lòng xin nghỉ phép trước khi xin học bù."
      );
      return;
    }

    // classId and date are the makeup class (the class student clicked on)
    const makeupClass = classes.find((c) => c._id?.toString() === classId);
    if (!makeupClass) {
      showError("Không tìm thấy lớp học");
      return;
    }

    // Set all states together - React 18 batches these automatically
    // Use a copy of the date to avoid reference issues
    const dateCopy = new Date(date);

    // Set the makeup class (already selected) and date
    // Note: We don't need to find originalClass here - it will be found in handleSubmitMakeup
    setSelectedClass(makeupClass);
    setSelectedDate(dateCopy);
    setAvailableClasses([makeupClass]);
    setShowMakeupModal(true);
  };

  const handleSelectClasses = async (classIds: string[]) => {
    if (!enrollment) return;

    try {
      console.log("Selected classIds:", classIds);

      // Create schedule sessions with selected classes
      // For series, only create one session per series (use first class in series as reference)
      const sessions: Array<{
        dayOfWeek: number;
        timeSlot: string;
        classId: string;
      }> = [];

      // Create sessions from selected classes
      // Each class has multiple sessions, create one session entry per class session
      for (const classId of classIds) {
        const cls = classes.find((c) => c._id?.toString() === classId);
        if (!cls || !cls.sessions) continue;

        // Create a session entry for each session in the class
        for (const session of cls.sessions) {
          sessions.push({
            dayOfWeek: session.dayOfWeek,
            timeSlot: `${session.startTime}-${session.endTime}`,
            classId: cls._id!.toString(),
          });
        }
      }

      console.log("Created sessions:", sessions);

      // Update enrollment with selected classes
      const response = await fetch(`/api/enrollments/${enrollment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule: { sessions },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update enrollment");
      }

      // Add student to selected classes
      // Add student to selected classes
      const classesToEnroll = new Set<string>(classIds);

      console.log(`Total classes to enroll: ${classesToEnroll.size}`);
      console.log("Classes to enroll:", Array.from(classesToEnroll));

      // Enroll student to all classes
      for (const classId of Array.from(classesToEnroll)) {
        const addResponse = await fetch(`/api/classes/${classId}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });

        if (!addResponse.ok) {
          console.error(`Failed to add student to class ${classId}`);
        }
      }

      // Refresh data
      await fetchStudentData(studentId);
      setShowSelectClassesModal(false);
      showSuccess("Đã chọn lớp học thành công!");
    } catch (error) {
      console.error("Error selecting classes:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi chọn lớp học";
      showError(errorMessage);
    }
  };

  // Calculate next scheduled class date from enrollment
  // Excludes classes that have approved absence requests
  // Note: Currently unused but kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getNextScheduledClassDate = (): Date | null => {
    if (!enrollment || !enrollment.schedule?.sessions) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Get all scheduled class dates from enrollment
    const scheduledDates: Date[] = [];

    enrollment.schedule.sessions.forEach((session) => {
      if (!session.classId) return;

      // Find the class
      const cls = classes.find(
        (c) => c._id?.toString() === session.classId?.toString()
      );
      if (!cls) return;

      // All classes repeat weekly, find sessions that match
      // Find session from enrollment that matches this class
      const matchingSession = enrollment.schedule.sessions.find(
        (s) => s.classId?.toString() === cls._id?.toString()
      );
      if (!matchingSession) return;

      // Get dayOfWeek from session (0-6)
      const dayOfWeek = matchingSession.dayOfWeek;
      const today = new Date();
      const currentDay = today.getDay();

      // Calculate days until next occurrence
      let daysUntilNext = dayOfWeek - currentDay;
      if (daysUntilNext <= 0) {
        daysUntilNext += 7; // Next week
      }

      // Check up to 8 weeks ahead to find the next class without absence
      for (let weekOffset = 0; weekOffset < 8; weekOffset++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + daysUntilNext + weekOffset * 7);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate >= now) {
          // Check if this date has excused absence (attendance with status "excused")
          const hasAbsence = hasExcusedAbsence(
            cls._id?.toString() || "",
            checkDate
          );

          // Only add if no excused absence
          if (!hasAbsence) {
            scheduledDates.push(checkDate);
            break; // Found the next class without absence, no need to check further
          }
        }
      }
    });

    // Return the earliest future scheduled date (without absence)
    if (scheduledDates.length === 0) return null;
    return scheduledDates.sort((a, b) => a.getTime() - b.getTime())[0];
  };

  // Get ALL future scheduled class dates (not just the next one)
  // Excludes classes that have approved absence requests
  const getAllFutureScheduledDates = (): Date[] => {
    if (!enrollment || !enrollment.schedule?.sessions) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const scheduledDates: Date[] = [];

    enrollment.schedule.sessions.forEach((session) => {
      if (!session.classId) return;

      // Find the class
      const cls = classes.find(
        (c) => c._id?.toString() === session.classId?.toString()
      );
      if (!cls) return;

      // All classes repeat weekly, find sessions that match
      // Get dayOfWeek from session (0-6)
      const dayOfWeek = session.dayOfWeek;
      const today = new Date();
      const currentDay = today.getDay();

      // Calculate days until next occurrence
      let daysUntilNext = dayOfWeek - currentDay;
      if (daysUntilNext <= 0) {
        daysUntilNext += 7; // Next week
      }

      // Check up to 8 weeks ahead
      for (let weekOffset = 0; weekOffset < 8; weekOffset++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + daysUntilNext + weekOffset * 7);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate >= now) {
          // Check if this date has excused absence (attendance with status "excused")
          const hasAbsence = hasExcusedAbsence(
            cls._id?.toString() || "",
            checkDate
          );

          // Check if this date is cancelled
          const isCancelled =
            cls.cancelledDates?.some((cancelledDate) => {
              const cancelled = new Date(cancelledDate);
              cancelled.setHours(0, 0, 0, 0);
              return cancelled.getTime() === checkDate.getTime();
            }) || false;

          // Only add if no excused absence and not cancelled
          if (!hasAbsence && !isCancelled) {
            scheduledDates.push(checkDate);
          }
        }
      }
    });

    // Return all future scheduled dates (sorted)
    return scheduledDates.sort((a, b) => a.getTime() - b.getTime());
  };

  const handleSubmitMakeup = async (
    newClassId: string,
    newDate: Date,
    reason: string
  ) => {
    if (!enrollment || !selectedClass || !selectedDate) return;

    // Find the new class
    const newClass = availableClasses.find(
      (c) => c._id?.toString() === newClassId
    );
    if (!newClass) {
      showError("Không tìm thấy lớp học bù");
      return;
    }

    // Check if class is full
    // No maxStudents limit anymore
    if (false) {
      showError("Lớp học này đã đầy. Vui lòng chọn lớp học khác.");
      return;
    }

    // Calculate actual new session date from session
    // Find session for this date
    const dayOfWeek = newDate.getDay();
    const session = newClass.sessions?.find((s) => s.dayOfWeek === dayOfWeek);
    if (!session) {
      showError("Không tìm thấy ca học cho ngày này");
      return;
    }

    const newSessionDate = new Date(newDate);
    const [startHour, startMin] = session.startTime.split(":").map(Number);
    newSessionDate.setHours(startHour, startMin, 0, 0);

    // Validate: Check if request is at least 1 day before new session
    const now = new Date();
    const daysUntilSession =
      (newSessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilSession < 1) {
      showError("Bạn chỉ có thể xin học bù trước 1 ngày của buổi học");
      return;
    }

    // Validate: Check if student has remaining makeup sessions
    // Count attendance records with status "excused" as absence requests
    const excusedAbsences = attendanceRecords.filter(
      (att) => att.status === "excused"
    ).length;
    const remainingMakeupSessions =
      excusedAbsences -
      makeupRequests.filter((m) => m.status === "approved").length;

    if (remainingMakeupSessions <= 0) {
      showError("Bạn không còn buổi học bù nào");
      return;
    }

    // Validate: Check if makeup date is adjacent to ANY future scheduled class OR approved makeup requests (within 1 day before or after)
    // If student has cancelled all future classes, they can still choose, but must not be adjacent to other makeup requests
    const futureScheduledDates = getAllFutureScheduledDates();
    const makeupDate = new Date(newSessionDate);
    makeupDate.setHours(0, 0, 0, 0);

    // Get all approved makeup request dates
    const approvedMakeupDates = makeupRequests
      .filter((m) => m.status === "approved")
      .map((m) => {
        const date = new Date(m.newSessionDate);
        date.setHours(0, 0, 0, 0);
        return date;
      });

    // Check if makeup date is too close (adjacent) to any future scheduled class
    // But allow same day if the scheduled class has been excused (student already requested absence)
    if (futureScheduledDates.length > 0) {
      const isTooCloseToScheduled = futureScheduledDates.some(
        (scheduledDate) => {
          const scheduled = new Date(scheduledDate);
          scheduled.setHours(0, 0, 0, 0);

          const daysDiff = Math.abs(
            (makeupDate.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24)
          );

          // If same day (daysDiff = 0), check if the scheduled class has been excused
          if (daysDiff === 0) {
            // Find the class that matches this scheduled date
            const scheduledClass = enrollment.schedule?.sessions
              ?.map((session) => {
                const cls = classes.find(
                  (c) => c._id?.toString() === session.classId?.toString()
                );
                if (!cls) return null;

                // Check if this is the class for this scheduled date
                // Find session that matches the scheduled day of week
                const scheduledDayOfWeek = scheduled.getDay();
                const matchingSession = cls.sessions?.find(
                  (s) => s.dayOfWeek === scheduledDayOfWeek
                );
                if (matchingSession) {
                  return cls;
                }
                return null;
              })
              .find((cls) => cls !== null);

            // If we found the class, check if student has excused absence for it
            if (scheduledClass) {
              const hasAbsence = hasExcusedAbsence(
                scheduledClass._id?.toString() || "",
                scheduledDate
              );
              // If student has excused absence for this class, allow same day makeup
              if (hasAbsence) {
                return false; // Not too close, allow it
              }
            }
          }

          // Not allowed if within 1 day (adjacent) to any future scheduled class
          return daysDiff <= 1;
        }
      );

      if (isTooCloseToScheduled) {
        showError("Ngày học bù không được kề bất kỳ buổi học nào.");
        return;
      }
    }

    // Check if makeup date is too close (adjacent) to any approved makeup request
    if (approvedMakeupDates.length > 0) {
      const isTooCloseToMakeup = approvedMakeupDates.some((makeupReqDate) => {
        const daysDiff = Math.abs(
          (makeupDate.getTime() - makeupReqDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Not allowed if within 1 day (adjacent) to any approved makeup request
        return daysDiff <= 1;
      });

      if (isTooCloseToMakeup) {
        showError("Ngày học bù không được kề bất kỳ buổi nào");
        return;
      }
    }

    // Find the original class from enrollment (the class student is enrolled in)
    let originalClass: Class | null = null;
    let originalSessionDate: Date | null = null;

    if (
      enrollment.schedule?.sessions &&
      enrollment.schedule.sessions.length > 0
    ) {
      // Get the first session's classId as the original class
      const firstSession = enrollment.schedule.sessions[0];
      if (firstSession.classId) {
        originalClass =
          classes.find(
            (c) => c._id?.toString() === firstSession.classId?.toString()
          ) || null;

        // Calculate the original date (next scheduled class date)
        if (
          originalClass &&
          originalClass.sessions &&
          originalClass.sessions.length > 0
        ) {
          const today = new Date();
          // Use first session as reference (or find matching session from enrollment)
          const firstSession = originalClass.sessions[0];
          const dayOfWeek = firstSession.dayOfWeek;
          const currentDay = today.getDay();
          let daysUntilNext = dayOfWeek - currentDay;
          if (daysUntilNext <= 0) {
            daysUntilNext += 7; // Next week
          }
          originalSessionDate = new Date(today);
          originalSessionDate.setDate(today.getDate() + daysUntilNext);
          const [startHour, startMin] = firstSession.startTime
            .split(":")
            .map(Number);
          originalSessionDate.setHours(startHour, startMin, 0, 0);
        }
      }
    }

    // If we couldn't find originalClass, use selectedClass as fallback
    // (This should not happen in normal flow, but provides a safety net)
    if (!originalClass || !originalSessionDate) {
      if (selectedClass && selectedDate) {
        originalClass = selectedClass;
        // Find session for selected date
        const dayOfWeek = selectedDate.getDay();
        const session = selectedClass.sessions?.find(
          (s) => s.dayOfWeek === dayOfWeek
        );
        if (session) {
          originalSessionDate = new Date(selectedDate);
          const [startHour, startMin] = session.startTime
            .split(":")
            .map(Number);
          originalSessionDate.setHours(startHour, startMin, 0, 0);
        } else {
          showError("Không tìm thấy lớp học gốc");
          return;
        }
      } else {
        showError("Không tìm thấy lớp học gốc");
        return;
      }
    }

    try {
      const response = await fetch("/api/makeups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          enrollmentId: enrollment._id?.toString(),
          originalClassId: originalClass._id?.toString(),
          originalSessionDate: originalSessionDate.toISOString(),
          newClassId,
          newSessionDate: newSessionDate.toISOString(),
          reason,
        }),
      });

      if (response.ok) {
        showSuccess("Đã gửi yêu cầu xin học bù!");
        setShowMakeupModal(false);
        setSelectedClass(null);
        setSelectedDate(null);
        // Refresh data
        await fetchStudentData(studentId);
      } else {
        const error = await response.json();
        showError(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      console.error("Error requesting makeup:", error);
      showError("Có lỗi xảy ra khi xin học bù");
    }
  };

  if (loading) {
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

  if (!user || user.role !== "student") {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--page-background)" }}
      >
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "#6C584C" }}
            >
              Không có quyền truy cập
            </h2>
            <p style={{ color: "#A98467" }}>
              Vui lòng đăng nhập với tài khoản học viên.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calendar is now based on classes, not enrollment
  // This check is removed - calendar will show if student has classes

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--page-background)" }}
    >
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg" style={{ color: "#6C584C" }}>
              Đang tải...
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div
              className="text-xl font-semibold mb-2"
              style={{ color: "#6C584C" }}
            >
              Bạn chưa có lớp học nào
            </div>
            <div className="text-sm" style={{ color: "#A98467" }}>
              Vui lòng liên hệ giáo viên để được thêm vào lớp học
            </div>
          </div>
        ) : (
          <WeekCalendar
            role="student"
            classes={classes}
            enrollment={enrollment || undefined}
            studentId={studentId}
            onRequestAbsence={handleRequestAbsence}
            onRequestMakeup={handleRequestMakeup}
            attendanceRecords={attendanceRecords}
            makeupRequests={makeupRequests.map((m) => ({
              newClassId: m.newClassId?.toString(),
              newSessionDate: new Date(m.newSessionDate),
              status: m.status,
            }))}
          />
        )}

        {showSelectClassesModal && enrollment && (
          <SelectClassesModal
            enrollment={enrollment}
            classes={classes}
            onClose={() => setShowSelectClassesModal(false)}
            onSelect={handleSelectClasses}
          />
        )}

        {showMakeupModal &&
          selectedClass &&
          selectedDate &&
          (() => {
            // Calculate the start of the week (Sunday) for the selected date
            const weekStart = new Date(selectedDate);
            const day = weekStart.getDay();
            weekStart.setDate(weekStart.getDate() - day);
            weekStart.setHours(0, 0, 0, 0);

            return (
              <MakeupRequestModal
                originalClass={selectedClass}
                originalDate={selectedDate}
                availableClasses={availableClasses}
                currentWeekStart={weekStart}
                onClose={() => {
                  setShowMakeupModal(false);
                  setSelectedClass(null);
                  setSelectedDate(null);
                }}
                onSubmit={handleSubmitMakeup}
              />
            );
          })()}
      </div>
    </div>
  );
}
