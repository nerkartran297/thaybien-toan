"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Class } from "@/models/Class";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { Attendance, CreateAttendanceData } from "@/models/Attendance";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";

// Color palette
const colors = {
  light: "#F0EAD2", // Light beige
  lightGreen: "#DDE5B6", // Light green
  mediumGreen: "#ADC178", // Medium green
  brown: "#A98467", // Brown
  darkBrown: "#6C584C", // Dark brown
};

interface WeekCalendarProps {
  role: "teacher" | "student";
  classes?: Class[];
  enrollment?: StudentEnrollment;
  studentId?: string;
  onCancelClass?: (classId: string, date: Date) => void;
  onCreateClass?: () => void;
  onEditClass?: (classId: string) => void;
  onRequestAbsence?: (classId: string, date: Date, reason: string) => void;
  onAttendanceUpdated?: () => void; // Callback to refresh attendance records after finalizing
  attendanceRecords?: Array<{
    sessionDate: Date;
    studentId?: string;
    classId?: string;
    status?: string;
  }>;
}

export default function WeekCalendar({
  role,
  classes = [],
  enrollment,
  studentId,
  onCancelClass,
  onCreateClass,
  onEditClass,
  onRequestAbsence,
  onAttendanceUpdated,
  attendanceRecords = [],
}: WeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<
    Map<string, StudentEnrollment>
  >(new Map());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "cancel" | "absence" | "create" | "attendance"
  >("cancel");
  const [hoveredClassBlock, setHoveredClassBlock] = useState<{
    classId: string;
    date: Date;
  } | null>(null);

  const daysOfWeek = [
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
    "Chủ nhật",
  ];

  // Helper function to format date as yyyy-mm-dd in local timezone (GMT+7)
  // This avoids timezone conversion issues when using toISOString()
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to check if student has excused absence (attendance with status "excused")
  const hasExcusedAbsence = (
    studentId: string,
    classId: string,
    date: Date
  ): boolean => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const checkDateStr = formatDateLocal(checkDate);

    return attendanceRecords.some((att) => {
      if (att.studentId?.toString() !== studentId) return false;
      if (att.classId?.toString() !== classId) return false;
      if (att.status !== "excused") return false;
      const attDate = new Date(att.sessionDate);
      attDate.setHours(0, 0, 0, 0);
      const attDateStr = formatDateLocal(attDate);
      return attDateStr === checkDateStr;
    });
  };

  // Helper function to check if class has pending temp data (not finalized)
  const hasPendingTempData = (classId: string, date: Date): boolean => {
    try {
      const storageKey = `class_session_${classId}_${date.toISOString().split('T')[0]}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Check if there's any temp data
        const hasTempScores = parsed.tempScores && Object.keys(parsed.tempScores).length > 0;
        const hasTempGold = parsed.tempGold && Object.keys(parsed.tempGold).length > 0;
        const hasTempAttendance = parsed.tempAttendance && Object.keys(parsed.tempAttendance).length > 0;
        return hasTempScores || hasTempGold || hasTempAttendance;
      }
    } catch (error) {
      // Ignore errors
    }
    return false;
  };

  // Helper function to check if student was enrolled before or on the class date
  // const isStudentEnrolledForDate = (
  //   studentId: string,
  //   classDate: Date
  // ): boolean => {
  //   const enrollment = studentEnrollments.get(studentId);
  //   if (!enrollment) return true; // If no enrollment found, assume enrolled (fallback)

  //   // Check if class date is on or after enrollment startDate
  //   const enrollmentStartDate = new Date(enrollment.startDate);
  //   enrollmentStartDate.setHours(0, 0, 0, 0);
  //   const checkDate = new Date(classDate);
  //   checkDate.setHours(0, 0, 0, 0);

  //   return checkDate >= enrollmentStartDate;
  // };

  // Fetch enrollments for all students in all classes
  useEffect(() => {
    if (role === "teacher" && classes.length > 0) {
      const fetchAllEnrollments = async () => {
        try {
          // Get all unique student IDs from all classes
          const allStudentIds = new Set<string>();
          classes.forEach((cls) => {
            cls.enrolledStudents.forEach((studentId) => {
              allStudentIds.add(studentId.toString());
            });
          });

          // Fetch enrollments for all students
          const enrollmentPromises = Array.from(allStudentIds).map(
            async (studentId) => {
              try {
                const response = await fetch(
                  `/api/enrollments?studentId=${studentId}`
                );
                if (response.ok) {
                  const enrollments = await response.json();
                  // Get the most recent active/pending enrollment, or the most recent one
                  const activeEnrollment =
                    enrollments.find(
                      (e: StudentEnrollment) =>
                        e.status === "active" || e.status === "pending"
                    ) || enrollments[0];
                  return { studentId, enrollment: activeEnrollment };
                }
              } catch (error) {
                console.error(
                  `Error fetching enrollment for student ${studentId}:`,
                  error
                );
              }
              return { studentId, enrollment: null };
            }
          );

          const results = await Promise.all(enrollmentPromises);
          const enrollmentsMap = new Map<string, StudentEnrollment>();
          results.forEach(({ studentId, enrollment }) => {
            if (enrollment) {
              enrollmentsMap.set(studentId, enrollment);
            }
          });
          setStudentEnrollments(enrollmentsMap);
        } catch (error) {
          console.error("Error fetching enrollments:", error);
        }
      };

      fetchAllEnrollments();
    }
  }, [role, classes]);

  // Generate time slots from 6AM to 12PM (midnight) - every 30 minutes
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 23; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get week dates (Monday to Sunday)
  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Calculate days to subtract to get to Monday (1)
    // If Sunday (0), subtract 6 days to get to Monday
    // If Monday (1), subtract 0 days
    // If Tuesday (2), subtract 1 day
    // etc.
    const daysToSubtract = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(currentDate);

  // Get all classes for a specific date (not just for a time slot)
  // Returns array of { class, session } pairs for classes that have a session on this date
  const getClassesForDate = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    const result: Array<{
      class: Class;
      session: { dayOfWeek: number; startTime: string; endTime: string };
    }> = [];

    classes.forEach((cls) => {
      // Check if class has any session on this day of week
      cls.sessions?.forEach((session) => {
        if (session.dayOfWeek === dayOfWeek) {
          result.push({ class: cls, session });
        }
      });
    });

    return result;
  };

  // Calculate class position and height (in pixels)
  const TIME_SLOT_HEIGHT = 21; // Fixed height per 30 minutes in pixels

  const getClassPosition = (
    session: { startTime: string; endTime: string },
    date: Date
  ) => {
    // Parse session times (HH:mm format)
    const [startHour, startMin] = session.startTime.split(":").map(Number);
    const [endHour, endMin] = session.endTime.split(":").map(Number);

    // Create actual times for this date
    const actualStartTime = new Date(date);
    actualStartTime.setHours(startHour, startMin, 0, 0);

    const actualEndTime = new Date(date);
    actualEndTime.setHours(endHour, endMin, 0, 0);

    // Calculate position (top) in pixels
    // Each hour has 2 slots (00 and 30), so we need to calculate based on 30-minute intervals
    const startSlotIndex = (startHour - 8) * 2 + (startMin >= 30 ? 1 : 0);
    const top =
      startSlotIndex * TIME_SLOT_HEIGHT +
      ((startMin % 30) / 30) * TIME_SLOT_HEIGHT +
      TIME_SLOT_HEIGHT / 2;

    // Calculate duration in 30-minute slots
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;
    const durationSlots = durationMinutes / 30; // Duration in 30-minute slots

    // Calculate height in pixels
    const height = durationSlots * TIME_SLOT_HEIGHT;

    return { top, height, startHour, startMin, endHour, endMin };
  };

  // Check if date is the first day of enrollment (for students)
  const isFirstDayOfEnrollment = (date: Date) => {
    if (!enrollment || role !== "student") return false;
    const startDate = new Date(enrollment.startDate);
    startDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return startDate.getTime() === checkDate.getTime();
  };

  // Check if date has attendance record (for students)
  const hasAttendanceOnDate = (date: Date) => {
    if (role !== "student" || attendanceRecords.length === 0) return false;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return attendanceRecords.some((record) => {
      const recordDate = new Date(record.sessionDate);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === checkDate.getTime();
    });
  };

  // Check if class is in the past
  const isPast = (date: Date, hour: number) => {
    const now = new Date();
    const classDateTime = new Date(date);
    classDateTime.setHours(hour, 0, 0, 0);
    return classDateTime < now;
  };

  // Check if a class is cancelled on a specific date
  const isCancelled = (cls: Class, date: Date) => {
    if (!cls.cancelledDates || cls.cancelledDates.length === 0) {
      return false;
    }

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return cls.cancelledDates.some((cancelledDate) => {
      const cancelled = new Date(cancelledDate);
      cancelled.setHours(0, 0, 0, 0);
      return cancelled.getTime() === checkDate.getTime();
    });
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
    });
  };

  // Handle class click
  const handleClassClick = (
    cls: Class,
    date: Date,
    type: "cancel" | "absence" | "attendance"
  ) => {
    setSelectedClass(cls);
    setSelectedDate(date);
    setModalType(type);
    setShowModal(true);
  };

  return (
    <div className="w-full">
      {/* Header with navigation */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousWeek}
            className="rounded-lg p-2 hover:bg-[#DDE5B6] transition-colors"
            style={{ color: colors.darkBrown }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div
            className="text-lg font-semibold"
            style={{ color: colors.darkBrown }}
          >
            {weekDates[0].toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "long",
            })}{" "}
            -{" "}
            {weekDates[6].toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <button
            onClick={goToNextWeek}
            className="rounded-lg p-2 hover:bg-[#DDE5B6] transition-colors"
            style={{ color: colors.darkBrown }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {role === "teacher" && onCreateClass && (
          <button
            onClick={onCreateClass}
            className="rounded-lg px-4 py-2 font-medium transition-colors"
            style={{
              backgroundColor: colors.mediumGreen,
              color: "white",
            }}
          >
            + Tạo lớp mới
          </button>
        )}
      </div>

      {/* Calendar Grid - Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <div
          className="rounded-lg border-2 min-w-[800px]"
          style={{ borderColor: colors.brown }}
        >
          {/* Header row with days */}
          <div
            className="grid grid-cols-8"
            style={{ backgroundColor: colors.lightGreen }}
          >
            <div
              className="p-2 font-bold text-center border-r-2  border-b-2 flex justify-center items-center"
              style={{ borderColor: colors.brown, color: colors.darkBrown }}
            >
              Giờ học
            </div>
            {weekDates.map((date, index) => {
              const hasAttendance = hasAttendanceOnDate(date);
              return (
                <div
                  key={index}
                  className={`p-2 text-center border-r-2 last:border-r-0 border-b-2`}
                  style={{
                    borderColor: colors.brown,
                    color: colors.darkBrown,
                    backgroundColor: hasAttendance
                      ? colors.mediumGreen
                      : colors.lightGreen,
                  }}
                >
                  <div className="font-semibold">
                    {daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                  </div>
                  <div className="text-sm">{formatDate(date)}</div>
                </div>
              );
            })}
          </div>

          {/* Time slots - No height limit, fixed height per slot */}
          <div className="relative">
            {/* Time column - Fixed position */}
            <div
              className="absolute left-0 top-0 w-[12.5%] border-r-2 z-10"
              style={{
                backgroundColor: "var(--time-column-background)",
                borderColor: colors.brown,
                height: `${timeSlots.length * TIME_SLOT_HEIGHT}px`,
              }}
            >
              {timeSlots.map((timeSlot, timeIndex) => {
                const [, minute] = timeSlot.split(":").map(Number);
                const showLabel = minute === 0; // Show full hour labels
                const showHalfHour = minute === 30; // Show 30-minute labels

                return (
                  <div
                    key={timeIndex}
                    className="text-center font-medium"
                    style={{
                      height: `${TIME_SLOT_HEIGHT}px`,
                      borderColor: colors.light,
                      color: colors.darkBrown,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: showLabel || showHalfHour ? "0.5rem" : "0",
                      fontSize: showLabel
                        ? "0.87rem"
                        : showHalfHour
                        ? "0.87rem"
                        : "0.87rem",
                    }}
                  >
                    {showLabel || showHalfHour ? timeSlot : " "}
                  </div>
                );
              })}
            </div>

            {/* Day columns - With absolute positioned classes */}
            <div className="grid grid-cols-7 ml-[12.5%]">
              {weekDates.map((date, dayIndex) => {
                const classesForDate = getClassesForDate(date);
                const isStartDate = isFirstDayOfEnrollment(date);

                return (
                  <div
                    key={dayIndex}
                    className="border-r-2 last:border-r-0 relative"
                    style={{
                      borderColor: colors.brown,
                      backgroundColor:
                        role === "student"
                          ? isStartDate
                            ? "#FFF9E6"
                            : "white"
                          : "white",
                      height: `${timeSlots.length * TIME_SLOT_HEIGHT}px`,
                    }}
                  >
                    {/* Hour dividers */}
                    {timeSlots.map((_, timeIndex) => (
                      <div
                        key={timeIndex}
                        className="absolute left-0 right-0"
                        style={{
                          borderColor: colors.light,
                          top: `${timeIndex * TIME_SLOT_HEIGHT}px`,
                          height: `${TIME_SLOT_HEIGHT}px`,
                        }}
                      >
                        {/* Middle divider line */}
                        <div
                          className="absolute left-0 right-0"
                          style={{
                            top: `${TIME_SLOT_HEIGHT / 2}px`,
                            height: "1px",
                            backgroundColor: colors.light,
                          }}
                        />
                      </div>
                    ))}

                    {/* Class blocks - Absolute positioned */}
                    {classesForDate.map(({ class: cls, session }) => {
                      const position = getClassPosition(session, date);
                      const classDateForFull = new Date(date);
                      classDateForFull.setHours(0, 0, 0, 0);

                      // const validEnrolledStudentsForFull =
                      //   cls.enrolledStudents.filter((studentId) => {
                      //     if (role === "teacher") {
                      //       return true; // Teacher sees all enrolled students
                      //     }
                      //     if (enrollment) {
                      //       const enrollmentStartDate = new Date(
                      //         enrollment.startDate
                      //       );
                      //       enrollmentStartDate.setHours(0, 0, 0, 0);
                      //       return classDateForFull >= enrollmentStartDate;
                      //     }
                      //     return true;
                      //   });

                      // No maxStudents limit anymore
                      const isFull = false;
                      const isEnrolled =
                        role === "student" &&
                        studentId &&
                        cls.enrolledStudents.some(
                          (id) => id.toString() === studentId
                        );

                      // Parse session start time to check if past
                      const [startHour, startMin] = session.startTime
                        .split(":")
                        .map(Number);
                      const isPastClass = isPast(date, startHour);
                      const isCancelledOnDate = isCancelled(cls, date);

                      const hasAbsenceRequest =
                        role === "student" &&
                        studentId &&
                        hasExcusedAbsence(
                          studentId,
                          cls._id?.toString() || "",
                          date
                        );

                      const absenceCountForDate =
                        role === "teacher"
                          ? (() => {
                              const checkDate = new Date(date);
                              checkDate.setHours(0, 0, 0, 0);
                              const checkDateStr = formatDateLocal(checkDate);

                              const relevantAttendances =
                                attendanceRecords.filter((att) => {
                                  if (
                                    att.classId?.toString() !==
                                    cls._id?.toString()
                                  )
                                    return false;
                                  // Normalize status for comparison (case-insensitive)
                                  const normalizedStatus = att.status?.toLowerCase();
                                  
                                  // P (excused) và K (absent) đều tính vào vắng
                                  if (normalizedStatus !== "excused" && normalizedStatus !== "absent") {
                                    return false;
                                  }
                                  const attDate = new Date(att.sessionDate);
                                  attDate.setHours(0, 0, 0, 0);
                                  const attDateStr = formatDateLocal(attDate);
                                  return attDateStr === checkDateStr;
                                });

                              const uniqueStudents = new Set<string>();
                              relevantAttendances.forEach((att) => {
                                if (att.studentId) {
                                  uniqueStudents.add(att.studentId.toString());
                                }
                              });

                              return uniqueStudents.size;
                            })()
                          : 0;


                      const classDate = new Date(date);
                      classDate.setHours(0, 0, 0, 0);

                      const validEnrolledStudents = cls.enrolledStudents.filter(
                        (studentId) => {
                          if (role === "teacher") {
                            return true; // Teacher sees all enrolled students
                          }
                          if (enrollment) {
                            const enrollmentStartDate = new Date(
                              enrollment.startDate
                            );
                            enrollmentStartDate.setHours(0, 0, 0, 0);
                            return classDate >= enrollmentStartDate;
                          }
                          return true;
                        }
                      );

                      let studentCountForDate = validEnrolledStudents.length;
                      if (role === "student") {
                        if (isEnrolled && hasAbsenceRequest) {
                          studentCountForDate -= 1;
                        }
                      }

                      // Check if class has pending temp data
                      const hasPendingData = role === "teacher" && hasPendingTempData(cls._id?.toString() || "", date);
                      
                      // Get base background color for teacher
                      let teacherBgColor = "var(--teacher-class-available)";
                      if (isCancelledOnDate) {
                        teacherBgColor = "var(--teacher-class-cancelled)";
                      } else if (isFull) {
                        teacherBgColor = "var(--teacher-class-full)";
                      }
                      
                      // Darken background if has pending data
                      if (hasPendingData && !isCancelledOnDate) {
                        // Apply a darker shade by using CSS filter or opacity
                        // We'll use a slightly darker version of the base color
                        teacherBgColor = isFull
                          ? "var(--teacher-class-full)"
                          : "#8BA397"; // Darker version of teacher-class-available for pending changes
                      }

                      return (
                        <div
                          key={cls._id?.toString()}
                          className={`absolute left-1 right-1 rounded-lg p-2 transition-all hover:shadow-lg border-2 border-gray-300 ${
                            role === "student" && isPastClass
                              ? "opacity-100"
                              : "cursor-pointer"
                          }`}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                            backgroundColor:
                              role === "student"
                                ? isCancelledOnDate
                                  ? "var(--class-cancelled)"
                                  : hasAbsenceRequest
                                  ? "var(--class-absence)"
                                  : isEnrolled
                                  ? "var(--class-regular)"
                                  : isFull
                                  ? "var(--class-full)"
                                  : "var(--class-available)"
                                : teacherBgColor,
                            color:
                              role === "student"
                                ? isCancelledOnDate
                                  ? "var(--text-cancelled)"
                                  : hasAbsenceRequest
                                  ? "var(--text-absence)"
                                  : isEnrolled
                                  ? "var(--text-regular)"
                                  : isFull
                                  ? "var(--text-full)"
                                  : "var(--text-available)"
                                : isCancelledOnDate
                                ? "var(--text-teacher-cancelled)"
                                : isFull
                                ? "var(--text-teacher-full)"
                                : "var(--text-teacher-available)",
                            zIndex: 20,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                          }}
                          onClick={() => {
                            if (role === "student") {
                              if (
                                isPastClass ||
                                isCancelledOnDate ||
                                hasAbsenceRequest
                              )
                                return;
                              if (isEnrolled) {
                                handleClassClick(cls, date, "absence");
                              }
                            }
                            if (role === "teacher") {
                              // Always open attendance modal when clicking on class
                                handleClassClick(cls, date, "attendance");
                            }
                          }}
                          onMouseEnter={() => {
                            if (role === "student") {
                              setHoveredClassBlock({
                                classId: cls._id?.toString() || "",
                                date,
                              });
                            }
                          }}
                          onMouseLeave={() => {
                            if (role === "student") {
                              setHoveredClassBlock(null);
                            }
                          }}
                        >
                          <div className="h-full flex flex-col items-center justify-center px-1">
                            {role === "student" && (
                              <div
                                className={`font-semibold text-sm text-center transition-opacity break-words ${
                                  hoveredClassBlock &&
                                  hoveredClassBlock.classId ===
                                    cls._id?.toString() &&
                                  hoveredClassBlock.date.toDateString() ===
                                    date.toDateString() &&
                                  ((isEnrolled &&
                                    !isPastClass &&
                                    !isCancelledOnDate &&
                                    !hasAbsenceRequest) ||
                                    (!isEnrolled &&
                                      !isPastClass &&
                                      !isCancelledOnDate))
                                    ? "opacity-0 absolute pointer-events-none"
                                    : "opacity-100"
                                }`}
                                style={{
                                  color: "inherit",
                                  wordBreak: "break-word",
                                  overflowWrap: "break-word",
                                  hyphens: "auto",
                                }}
                              >
                                {cls.name}
                              </div>
                            )}

                            {role === "student" &&
                              hoveredClassBlock &&
                              hoveredClassBlock.classId ===
                                cls._id?.toString() &&
                              hoveredClassBlock.date.toDateString() ===
                                date.toDateString() && (
                                <div className="flex flex-col gap-2 items-center">
                                  {isEnrolled &&
                                    !isPastClass &&
                                    !isCancelledOnDate &&
                                    !hasAbsenceRequest && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleClassClick(
                                            cls,
                                            date,
                                            "absence"
                                          );
                                        }}
                                        className="text-xs px-3 py-1.5 rounded hover:bg-orange-500 hover:text-white transition-colors whitespace-nowrap"
                                        style={{
                                          backgroundColor: colors.darkBrown,
                                          color: "white",
                                        }}
                                      >
                                        Xin vắng
                                      </button>
                                    )}
                                </div>
                              )}

                            {role === "teacher" && (
                              <div className="text-xs space-y-0.5 w-full">
                                <div
                                  className="text-sm font-semibold break-words"
                                  style={{
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    color: "inherit",
                                  }}
                                >
                                  {cls.name}
                                </div>
                                <div
                                  className="text-xs opacity-75 break-words"
                                  style={{
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    color: "inherit",
                                  }}
                                >
                                  {validEnrolledStudents.length} học sinh
                                </div>
                                {role === "teacher" &&
                                  absenceCountForDate > 0 && (
                                    <div
                                      className="text-[9px] opacity-60 break-words"
                                      style={{
                                        wordBreak: "break-word",
                                        overflowWrap: "break-word",
                                        color: "inherit",
                                      }}
                                    >
                                      <span>
                                        Vắng: {absenceCountForDate}{" "}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Mobile with frozen time column */}
      <div className="block md:hidden overflow-x-auto -mx-8 px-4">
        <div
          className="border-2"
          style={{
            borderColor: colors.brown,
            minWidth: "max-content",
            width: "max-content",
          }}
        >
          {/* Header row with days */}
          <div className="flex" style={{ backgroundColor: colors.lightGreen }}>
            {/* Frozen time column header */}
            <div
              className="sticky left-0 z-20 p-2 font-bold text-center border-r-2 border-b-2 flex justify-center items-center flex-shrink-0"
              style={{
                borderColor: colors.brown,
                color: colors.darkBrown,
                backgroundColor: colors.lightGreen,
                minWidth: "80px",
                width: "80px",
                boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
              }}
            >
              <div className="text-xs">Giờ</div>
            </div>
            {/* Scrollable day headers */}
            <div className="flex">
              {weekDates.map((date, index) => {
                const isStartDate = isFirstDayOfEnrollment(date);
                const hasAttendance = hasAttendanceOnDate(date);
                return (
                  <div
                    key={index}
                    className={`p-2 text-center border-r-2 last:border-r-0 border-b-2 flex-shrink-0 ${
                      isStartDate ? "ring-4 ring-yellow-400" : ""
                    }`}
                    style={{
                      borderColor: colors.brown,
                      color: colors.darkBrown,
                      backgroundColor:
                        hasAttendance && !isStartDate
                          ? colors.mediumGreen
                          : colors.lightGreen,
                      minWidth: "120px",
                      width: "120px",
                    }}
                  >
                    <div className="font-semibold text-xs">
                      {daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                    </div>
                    <div className="text-xs">{formatDate(date)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time slots with frozen time column */}
          <div className="flex">
            {/* Frozen time column */}
            <div
              className="sticky left-0 z-10 border-r-2 flex-shrink-0"
              style={{
                backgroundColor: "var(--time-column-background)",
                borderColor: colors.brown,
                minWidth: "80px",
                width: "80px",
                boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
              }}
            >
              {timeSlots.map((timeSlot, timeIndex) => {
                const [, minute] = timeSlot.split(":").map(Number);
                const showLabel = minute === 0;
                const showHalfHour = minute === 30;

                return (
                  <div
                    key={timeIndex}
                    className="text-center font-medium text-xs"
                    style={{
                      height: `${TIME_SLOT_HEIGHT}px`,
                      borderColor: colors.light,
                      color: colors.darkBrown,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: showLabel || showHalfHour ? "0.25rem" : "0",
                    }}
                  >
                    {showLabel || showHalfHour ? timeSlot : " "}
                  </div>
                );
              })}
            </div>

            {/* Scrollable day columns */}
            <div className="flex">
              {weekDates.map((date, dayIndex) => {
                const classesForDate = getClassesForDate(date);
                const isStartDate = isFirstDayOfEnrollment(date);

                return (
                  <div
                    key={dayIndex}
                    className="border-r-2 last:border-r-0 relative flex-shrink-0"
                    style={{
                      borderColor: colors.brown,
                      backgroundColor:
                        role === "student"
                          ? isStartDate
                            ? "#FFF9E6"
                            : "white"
                          : "white",
                      height: `${timeSlots.length * TIME_SLOT_HEIGHT}px`,
                      minWidth: "120px",
                      width: "120px",
                    }}
                  >
                    {/* Hour dividers */}
                    {timeSlots.map((_, timeIndex) => (
                      <div
                        key={timeIndex}
                        className="absolute left-0 right-0"
                        style={{
                          borderColor: colors.light,
                          top: `${timeIndex * TIME_SLOT_HEIGHT}px`,
                          height: `${TIME_SLOT_HEIGHT}px`,
                        }}
                      >
                        {/* Middle divider line */}
                        <div
                          className="absolute left-0 right-0"
                          style={{
                            top: `${TIME_SLOT_HEIGHT / 2}px`,
                            height: "1px",
                            backgroundColor: colors.light,
                          }}
                        />
                      </div>
                    ))}

                    {/* Class blocks - Absolute positioned */}
                    {classesForDate.map(({ class: cls, session }) => {
                      const position = getClassPosition(session, date);
                      const classDateForFull = new Date(date);
                      classDateForFull.setHours(0, 0, 0, 0);

                      const validEnrolledStudentsForFull =
                        cls.enrolledStudents.filter((studentId) => {
                          if (role === "teacher") {
                            return true;
                          }
                          if (enrollment) {
                            const enrollmentStartDate = new Date(
                              enrollment.startDate
                            );
                            enrollmentStartDate.setHours(0, 0, 0, 0);
                            return classDateForFull >= enrollmentStartDate;
                          }
                          return true;
                        });

                      const isFull = false;
                      const isEnrolled =
                        role === "student" &&
                        studentId &&
                        cls.enrolledStudents.some(
                          (id) => id.toString() === studentId
                        );

                      const [startHour, startMin] = session.startTime
                        .split(":")
                        .map(Number);
                      const isPastClass = isPast(date, startHour);
                      const isCancelledOnDate = isCancelled(cls, date);

                      const hasAbsenceRequest =
                        role === "student" &&
                        studentId &&
                        hasExcusedAbsence(
                          studentId,
                          cls._id?.toString() || "",
                          date
                        );

                      const absenceCountForDate =
                        role === "teacher"
                          ? (() => {
                              const checkDate = new Date(date);
                              checkDate.setHours(0, 0, 0, 0);
                              const checkDateStr = formatDateLocal(checkDate);

                              const relevantAttendances =
                                attendanceRecords.filter((att) => {
                                  if (
                                    att.classId?.toString() !==
                                    cls._id?.toString()
                                  )
                                    return false;
                                  // Normalize status for comparison (case-insensitive)
                                  const normalizedStatus = att.status?.toLowerCase();
                                  
                                  // P (excused) và K (absent) đều tính vào vắng
                                  if (normalizedStatus !== "excused" && normalizedStatus !== "absent") {
                                    return false;
                                  }
                                  const attDate = new Date(att.sessionDate);
                                  attDate.setHours(0, 0, 0, 0);
                                  const attDateStr = formatDateLocal(attDate);
                                  return attDateStr === checkDateStr;
                                });

                              const uniqueStudents = new Set<string>();
                              relevantAttendances.forEach((att) => {
                                if (att.studentId) {
                                  uniqueStudents.add(att.studentId.toString());
                                }
                              });

                              return uniqueStudents.size;
                            })()
                          : 0;


                      const classDate = new Date(date);
                      classDate.setHours(0, 0, 0, 0);

                      const validEnrolledStudents = cls.enrolledStudents.filter(
                        (studentId) => {
                          if (role === "teacher") {
                            return true;
                          }
                          if (enrollment) {
                            const enrollmentStartDate = new Date(
                              enrollment.startDate
                            );
                            enrollmentStartDate.setHours(0, 0, 0, 0);
                            return classDate >= enrollmentStartDate;
                          }
                          return true;
                        }
                      );

                      let studentCountForDate = validEnrolledStudents.length;
                      if (role === "student") {
                        if (isEnrolled && hasAbsenceRequest) {
                          studentCountForDate -= 1;
                        }
                      }

                      // Check if class has pending temp data
                      const hasPendingData = role === "teacher" && hasPendingTempData(cls._id?.toString() || "", date);
                      
                      // Get base background color for teacher
                      let teacherBgColor = "var(--teacher-class-available)";
                      if (isCancelledOnDate) {
                        teacherBgColor = "var(--teacher-class-cancelled)";
                      } else if (isFull) {
                        teacherBgColor = "var(--teacher-class-full)";
                      }
                      
                      // Darken background if has pending data
                      if (hasPendingData && !isCancelledOnDate) {
                        // Apply a darker shade by using CSS filter or opacity
                        // We'll use a slightly darker version of the base color
                        teacherBgColor = isFull
                          ? "var(--teacher-class-full)"
                          : "#8BA36A"; // Darker version of teacher-class-available for pending changes
                      }

                      return (
                        <div
                          key={cls._id?.toString()}
                          className={`absolute left-1 right-1 rounded-lg p-1.5 transition-all hover:shadow-lg border-2 border-gray-300 ${
                            role === "student" && isPastClass
                              ? "opacity-100"
                              : "cursor-pointer"
                          }`}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                            backgroundColor:
                              role === "student"
                                ? isCancelledOnDate
                                  ? "var(--class-cancelled)"
                                  : hasAbsenceRequest
                                  ? "var(--class-absence)"
                                  : isEnrolled
                                  ? "var(--class-regular)"
                                  : isFull
                                  ? "var(--class-full)"
                                  : "var(--class-available)"
                                : teacherBgColor,
                            color:
                              role === "student"
                                ? isCancelledOnDate
                                  ? "var(--text-cancelled)"
                                  : hasAbsenceRequest
                                  ? "var(--text-absence)"
                                  : isEnrolled
                                  ? "var(--text-regular)"
                                  : isFull
                                  ? "var(--text-full)"
                                  : "var(--text-available)"
                                : isCancelledOnDate
                                ? "var(--text-teacher-cancelled)"
                                : isFull
                                ? "var(--text-teacher-full)"
                                : "var(--text-teacher-available)",
                            zIndex: 5,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                          }}
                          onClick={() => {
                            if (role === "student") {
                              if (
                                isPastClass ||
                                isCancelledOnDate ||
                                hasAbsenceRequest
                              )
                                return;
                              if (isEnrolled) {
                                handleClassClick(cls, date, "absence");
                              }
                            }
                            if (role === "teacher") {
                              // Always open attendance modal when clicking on class
                                handleClassClick(cls, date, "attendance");
                            }
                          }}
                          onMouseEnter={() => {
                            if (role === "student") {
                              setHoveredClassBlock({
                                classId: cls._id?.toString() || "",
                                date,
                              });
                            }
                          }}
                          onMouseLeave={() => {
                            if (role === "student") {
                              setHoveredClassBlock(null);
                            }
                          }}
                        >
                          <div className="h-full flex flex-col items-center justify-center px-0.5">
                            {role === "student" && (
                              <div
                                className={`font-semibold text-xs text-center transition-opacity break-words ${
                                  hoveredClassBlock &&
                                  hoveredClassBlock.classId ===
                                    cls._id?.toString() &&
                                  hoveredClassBlock.date.toDateString() ===
                                    date.toDateString() &&
                                  ((isEnrolled &&
                                    !isPastClass &&
                                    !isCancelledOnDate &&
                                    !hasAbsenceRequest) ||
                                    (!isEnrolled &&
                                      !isPastClass &&
                                      !isCancelledOnDate))
                                    ? "opacity-0 absolute pointer-events-none"
                                    : "opacity-100"
                                }`}
                                style={{
                                  color: "inherit",
                                  wordBreak: "break-word",
                                  overflowWrap: "break-word",
                                  hyphens: "auto",
                                }}
                              >
                                {cls.name}
                              </div>
                            )}

                            {role === "student" &&
                              hoveredClassBlock &&
                              hoveredClassBlock.classId ===
                                cls._id?.toString() &&
                              hoveredClassBlock.date.toDateString() ===
                                date.toDateString() && (
                                <div className="flex flex-col gap-1.5 items-center">
                                  {isEnrolled &&
                                    !isPastClass &&
                                    !isCancelledOnDate &&
                                    !hasAbsenceRequest && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleClassClick(
                                            cls,
                                            date,
                                            "absence"
                                          );
                                        }}
                                        className="text-xs px-2 py-1 rounded hover:bg-orange-500 hover:text-white transition-colors whitespace-nowrap"
                                        style={{
                                          backgroundColor: colors.darkBrown,
                                          color: "white",
                                        }}
                                      >
                                        Xin vắng
                                      </button>
                                    )}
                                </div>
                              )}

                            {role === "teacher" && (
                              <div className="text-xs space-y-0.5 px-0.5 w-full">
                                <div
                                  className="text-sm font-semibold break-words"
                                  style={{
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    color: "inherit",
                                  }}
                                >
                                  {cls.name}
                                </div>
                                <div
                                  className="text-xs opacity-75 break-words"
                                  style={{
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    color: "inherit",
                                  }}
                                >
                                  {validEnrolledStudents.length} học sinh
                                </div>
                                {role === "teacher" &&
                                  absenceCountForDate > 0 && (
                                    <div
                                      className="text-[9px] opacity-60 break-words"
                                      style={{
                                        wordBreak: "break-word",
                                        overflowWrap: "break-word",
                                        color: "inherit",
                                      }}
                                    >
                                      <span>
                                        Vắng: {absenceCountForDate}{" "}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && selectedClass && selectedDate && (
        <ClassActionModal
          type={modalType}
          classData={selectedClass}
          date={selectedDate}
          onClose={() => {
            setShowModal(false);
            setSelectedClass(null);
            setSelectedDate(null);
          }}
          onCancelClass={onCancelClass}
          onEditClass={onEditClass}
          onRequestAbsence={onRequestAbsence}
          onAttendanceUpdated={onAttendanceUpdated}
          attendanceRecords={attendanceRecords}
          role={role}
        />
      )}
    </div>
  );
}

// ---------- Modal helpers ----------
type AttendanceStatus = "present" | "absent" | "excused";
type AttendanceStatusOrNull = AttendanceStatus | null;

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full border-2 border-black/20 border-t-black/70 animate-spin ${className}`}
      aria-label="Đang lưu"
    />
  );
}

function getInitials(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

function StatusPill({
  label,
  active,
  dimmed,
  disabled,
  saving,
  onClick,
  bg,
  fg,
}: {
  label: string;
  active: boolean;
  dimmed: boolean;
  disabled: boolean;
  saving: boolean;
  onClick: () => void;
  bg: { on: string; off: string };
  fg: { on: string; off: string };
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded text-sm font-black transition-all select-none
        ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:opacity-90 hover:scale-105 active:scale-[0.98]"}
        ${active ? "ring-2 ring-offset-1" : ""}
      `}
      style={{
        backgroundColor: active ? bg.on : bg.off,
        color: active ? fg.on : fg.off,
        opacity: saving ? 0.65 : dimmed ? 0.35 : 1,
        filter: saving ? "grayscale(0.15)" : undefined,
        boxShadow: active ? "0 8px 16px rgba(0,0,0,0.08)" : undefined,
      }}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

// Modal component for class actions
interface ClassActionModalProps {
  type: "cancel" | "absence" | "create" | "attendance";
  classData: Class;
  date: Date;
  onClose: () => void;
  onCancelClass?: (classId: string, date: Date) => void;
  onEditClass?: (classId: string) => void;
  onRequestAbsence?: (classId: string, date: Date, reason: string) => void;
  onAttendanceUpdated?: () => void; // Callback to refresh attendance records after finalizing
  attendanceRecords?: Array<{
    sessionDate: Date;
    studentId?: string;
    classId?: string;
    status?: string;
  }>;
  role?: "teacher" | "student";
}

function ClassActionModal({
  type,
  classData,
  date,
  onClose,
  onCancelClass,
  // onEditClass,
  onRequestAbsence,
  onAttendanceUpdated,
  attendanceRecords: propAttendanceRecords = [],
  role,
}: ClassActionModalProps) {
  const [reason, setReason] = useState("");
  const [students, setStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [savingAttendance, setSavingAttendance] = useState<string | null>(null);

  // UX state
  const [highlightStudentId, setHighlightStudentId] = useState<string | null>(null);
  const [pendingStatusByStudent, setPendingStatusByStudent] = useState<Record<string, AttendanceStatusOrNull>>({});
  const [recentlySavedByStudent, setRecentlySavedByStudent] = useState<Record<string, boolean>>({});

  const rowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const goldInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  const [studentProfiles, setStudentProfiles] = useState<
    Map<string, { 
      currentSeasonScore: number; 
      lifetimeScore: number; 
      gold: number;
      gradeRank: number | null;
      gradeTotal: number;
      globalRank: number | null;
      globalTotal: number;
      rank?: number;
    }>
  >(new Map());

  // Temporary scores and attendance (chưa lưu vào DB)
  const [tempScores, setTempScores] = useState<Map<string, number>>(new Map()); // Tổng điểm đã cộng tạm thời cho mỗi học sinh
  const [tempGold, setTempGold] = useState<Map<string, number>>(new Map()); // Tổng vàng đã cộng tạm thời cho mỗi học sinh
  const [tempAttendance, setTempAttendance] = useState<Map<string, AttendanceStatusOrNull>>(new Map()); // Điểm danh tạm thời
  const [tempInputValues, setTempInputValues] = useState<Map<string, string>>(new Map()); // Giá trị trong input hình chữ nhật (điểm)
  const [tempGoldInputValues, setTempGoldInputValues] = useState<Map<string, string>>(new Map()); // Giá trị trong input hình tròn (vàng)
  const [isFinalizing, setIsFinalizing] = useState(false); // Trạng thái đang tổng kết

  // Resizable sidebar state
  const [rightSideWidth, setRightSideWidth] = useState(420); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Sort state
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // RANKING UX: Track ranking changes for animations
  type RankSnapshot = { id: string; rank: number; score: number };
  type RankMeta = { 
    prevRank: number | null; 
    nextRank: number; 
    moved: "up" | "down" | "same";
    deltaScore: number;
    flash: boolean;
  };
  const prevRankingRef = useRef<RankSnapshot[]>([]);
  const [rankMetaById, setRankMetaById] = useState<Record<string, RankMeta>>({});

  const { user } = useAuth();

  const formatDateLocal = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const requestClose = useCallback(() => {
    if (savingAttendance) {
      showError("Đang lưu điểm danh, vui lòng chờ...");
      return;
    }
    onClose();
  }, [savingAttendance, onClose]);

  // ESC to close (UX #8)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestClose]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    if (showSortDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSortDropdown]);

  // Reset sort when type or date changes
  useEffect(() => {
    setSortOrder(null);
    setShowSortDropdown(false);
  }, [type, date]);

  // Handle resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const modal = resizeRef.current.closest('.bg-white.rounded-xl');
      if (!modal) return;
      
      const modalRect = (modal as HTMLElement).getBoundingClientRect();
      const newRightWidth = modalRect.right - e.clientX;
      
      // Min 300px, max 600px
      const clampedWidth = Math.max(300, Math.min(600, newRightWidth));
      setRightSideWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Fetch students when modal opens for teacher edit/attendance view
  useEffect(() => {
    if (
      type === "attendance" &&
      role === "teacher" &&
      classData.enrolledStudents.length > 0
    ) {
      const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
          const studentPromises = classData.enrolledStudents.map((studentId) =>
            fetch(`/api/students/${studentId}`).then((res) => res.json())
          );
          const studentData = await Promise.all(studentPromises);
          setStudents(studentData);

          // Fetch student profiles with scores and rankings
          const profileMap = new Map<string, { 
            currentSeasonScore: number; 
            lifetimeScore: number;
            gold: number;
            gradeRank: number | null;
            gradeTotal: number;
            globalRank: number | null;
            globalTotal: number;
            rank?: number;
          }>();
          
          for (const s of studentData) {
            const id = s._id?.toString();
            if (!id) continue;
            
            try {
              // Fetch profile data
              const profileRes = await fetch(`/api/students/${id}`);
              let profileData: any = {};
              if (profileRes.ok) {
                profileData = await profileRes.json();
              }

              // Fetch ranking data
              const rankingRes = await fetch(`/api/students/ranking?studentId=${id}`);
              let rankingData: any = {
                gradeRank: null,
                gradeTotal: 0,
                globalRank: null,
                globalTotal: 0,
                currentSeasonScore: 0,
              };
              if (rankingRes.ok) {
                rankingData = await rankingRes.json();
              }

              profileMap.set(id, {
                currentSeasonScore: rankingData.currentSeasonScore || profileData.currentSeasonScore || 0,
                lifetimeScore: profileData.lifetimeScore || 0,
                gold: profileData.gold || 0,
                gradeRank: rankingData.gradeRank,
                gradeTotal: rankingData.gradeTotal,
                globalRank: rankingData.globalRank,
                globalTotal: rankingData.globalTotal,
                rank: undefined,
              });
            } catch (error) {
              console.error(`Error fetching profile/ranking for student ${id}:`, error);
              profileMap.set(id, { 
                currentSeasonScore: 0, 
                lifetimeScore: 0,
                gold: 0,
                gradeRank: null,
                gradeTotal: 0,
                globalRank: null,
                globalTotal: 0,
                rank: undefined 
              });
            }
          }
          
          setStudentProfiles(profileMap);
        } catch (error) {
          console.error("Error fetching students:", error);
        } finally {
          setLoadingStudents(false);
        }
      };

      fetchStudents();
    }
  }, [type, role, classData._id, classData.enrolledStudents]);

  // Fetch attendance records for this class/date (teacher attendance)
  useEffect(() => {
    if (type === "attendance" && role === "teacher") {
      const fetchAttendanceData = async () => {
        try {
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);

          if (type === "attendance") {
            const checkDateStr = formatDateLocal(checkDate);
            const attendanceResponse = await fetch(
              `/api/attendance?classId=${classData._id}&sessionDate=${checkDateStr}`
            );
            if (attendanceResponse.ok) {
              const attendance = await attendanceResponse.json();
              setAttendanceRecords(attendance);
            }
          }

          setEnrollments([]);
        } catch (error) {
          console.error("Error fetching attendance data:", error);
        }
      };
      fetchAttendanceData();
    }
  }, [type, role, classData._id, classData.enrolledStudents, date]);


  const studentsForDate = useMemo(() => {
    if (role !== "teacher" || type !== "attendance") return [];
    const merged = [...students];
    const seen = new Set<string>();
    const out: Array<User & { hasAbsence?: boolean }> = [];
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const checkDateStr = formatDateLocal(checkDate);

    for (const s of merged) {
      const id = s._id?.toString() || "";
      if (!id || seen.has(id)) continue;
      seen.add(id);

        const hasAbsence = propAttendanceRecords.some((att) => {
        if (att.studentId?.toString() !== id) return false;
        if (att.classId?.toString() !== classData._id?.toString()) return false;
          if (att.status !== "excused") return false;
          const attDate = new Date(att.sessionDate);
          attDate.setHours(0, 0, 0, 0);
          const attDateStr = formatDateLocal(attDate);
        return attDateStr === checkDateStr;
      });

      out.push({ ...s, hasAbsence });
    }

    // Sort by currentSeasonScore if sortOrder is set
    if (sortOrder) {
      out.sort((a, b) => {
        const scoreA = studentProfiles.get(a._id?.toString() || "")?.currentSeasonScore || 0;
        const scoreB = studentProfiles.get(b._id?.toString() || "")?.currentSeasonScore || 0;
        return sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
      });
    }

    return out;
  }, [role, type, students, date, propAttendanceRecords, classData._id, sortOrder, studentProfiles]);

  const getAttendanceStatus = useCallback(
    (studentId: string): AttendanceStatusOrNull => {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
          const checkDateStr = formatDateLocal(checkDate);
      const sid = studentId.toString();

      const attendance = attendanceRecords.find((att) => {
        const attStudentId = att.studentId?.toString() || "";
        if (attStudentId !== sid) return false;
        const attDate = new Date(att.sessionDate);
        attDate.setHours(0, 0, 0, 0);
        const attDateStr = formatDateLocal(attDate);
          return attDateStr === checkDateStr;
        });

      if (!attendance) return null;
      if (attendance.status === "present" || attendance.status === "absent" || attendance.status === "excused") {
        return attendance.status;
      }
      return null;
    },
    [attendanceRecords, date]
  );

  const classRanking = useMemo(() => {
    const withScores = studentsForDate
      .map((student) => {
        const studentId = student._id?.toString() || "";
        const profile = studentProfiles.get(studentId);
        return { ...student, currentSeasonScore: profile?.currentSeasonScore || 0 } as User & {
          currentSeasonScore: number;
        };
      })
      .sort((a, b) => (b.currentSeasonScore || 0) - (a.currentSeasonScore || 0))
      .slice(0, 5);

    return withScores;
  }, [studentsForDate, studentProfiles]);

  // RANKING UX: Compare rankings and calculate changes
  useEffect(() => {
    if (type !== "attendance" || role !== "teacher") return;

    const currentSnapshot: RankSnapshot[] = classRanking.map((s, idx) => ({
      id: s._id?.toString() || "",
      rank: idx + 1,
      score: s.currentSeasonScore || 0,
    }));

    const prevSnapshot = prevRankingRef.current;
    if (prevSnapshot.length === 0) {
      prevRankingRef.current = currentSnapshot;
      return;
    }

    const newMeta: Record<string, RankMeta> = {};
    
    currentSnapshot.forEach((current) => {
      const prev = prevSnapshot.find((p) => p.id === current.id);
      const prevRank = prev ? prev.rank : null;
      const nextRank = current.rank;
      
      let moved: "up" | "down" | "same" = "same";
      if (prevRank !== null) {
        if (nextRank < prevRank) moved = "up";
        else if (nextRank > prevRank) moved = "down";
      }
      
      const deltaScore = prev ? current.score - prev.score : 0;
      const flash = moved !== "same" || deltaScore !== 0;

      newMeta[current.id] = {
        prevRank,
        nextRank,
        moved,
        deltaScore,
        flash,
      };
    });

    setRankMetaById(newMeta);
    prevRankingRef.current = currentSnapshot;

    // Clear flash after 1200ms
    const timer = setTimeout(() => {
      setRankMetaById((prev) => {
        const cleared: Record<string, RankMeta> = {};
        Object.keys(prev).forEach((id) => {
          cleared[id] = { ...prev[id], flash: false, deltaScore: 0 };
        });
        return cleared;
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [classRanking, type, role]);

  const scrollToStudent = useCallback((studentId: string) => {
    const el = rowRefs.current.get(studentId);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  const handleSubmit = () => {
    if (type === "cancel" && onCancelClass) {
      onCancelClass(classData._id!.toString(), date);
      requestClose();
    } else if (type === "absence" && onRequestAbsence) {
      onRequestAbsence(classData._id!.toString(), date, reason);
      requestClose();
    }
  };

  const getTitle = () => {
    switch (type) {
      case "cancel":
        return "Hủy lớp học";
      case "attendance":
        return "Điểm danh";
      case "absence":
        return "Xin vắng";
      default:
        return "";
    }
  };

  const flashSaved = useCallback((studentId: string) => {
    setRecentlySavedByStudent((prev) => ({ ...prev, [studentId]: true }));
    window.setTimeout(() => {
      setRecentlySavedByStudent((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }, 900);
  }, []);

  // Save temporary data to localStorage
  const saveTempDataToStorage = useCallback(() => {
    const storageKey = `class_session_${classData._id?.toString()}_${date.toISOString().split('T')[0]}`;
    try {
      const dataToSave = {
        tempScores: Object.fromEntries(tempScores),
        tempGold: Object.fromEntries(tempGold),
        tempAttendance: Object.fromEntries(tempAttendance),
        tempInputValues: Object.fromEntries(tempInputValues),
        tempGoldInputValues: Object.fromEntries(tempGoldInputValues),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [classData._id, date, tempScores, tempGold, tempAttendance, tempInputValues, tempGoldInputValues]);

  // Load temporary data from localStorage when modal opens
  useEffect(() => {
    if (type === "attendance" && role === "teacher" && classData._id) {
      const storageKey = `class_session_${classData._id?.toString()}_${date.toISOString().split('T')[0]}`;
      try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          
          // Restore tempScores
          if (parsed.tempScores && Object.keys(parsed.tempScores).length > 0) {
            setTempScores(new Map(Object.entries(parsed.tempScores).map(([k, v]) => [k, Number(v)])));
          }
          
          // Restore tempGold
          if (parsed.tempGold && Object.keys(parsed.tempGold).length > 0) {
            setTempGold(new Map(Object.entries(parsed.tempGold).map(([k, v]) => [k, Number(v)])));
          }
          
          // Restore tempAttendance
          if (parsed.tempAttendance && Object.keys(parsed.tempAttendance).length > 0) {
            setTempAttendance(new Map(Object.entries(parsed.tempAttendance)));
      }
          
          // Restore tempInputValues
          if (parsed.tempInputValues && Object.keys(parsed.tempInputValues).length > 0) {
            setTempInputValues(new Map(Object.entries(parsed.tempInputValues)));
          }
          
          // Restore tempGoldInputValues
          if (parsed.tempGoldInputValues && Object.keys(parsed.tempGoldInputValues).length > 0) {
            setTempGoldInputValues(new Map(Object.entries(parsed.tempGoldInputValues)));
          }
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    }
  }, [type, role, classData._id, date]);

  // Save to localStorage whenever temp data changes
  useEffect(() => {
    if (type === "attendance" && role === "teacher" && classData._id) {
      // Only save if there's actual data to save
      if (tempScores.size > 0 || tempGold.size > 0 || tempAttendance.size > 0 || tempInputValues.size > 0 || tempGoldInputValues.size > 0) {
        saveTempDataToStorage();
      } else {
        // If all temp data is cleared, also clear localStorage
        const storageKey = `class_session_${classData._id?.toString()}_${date.toISOString().split('T')[0]}`;
        localStorage.removeItem(storageKey);
      }
    }
  }, [tempScores, tempGold, tempAttendance, tempInputValues, tempGoldInputValues, saveTempDataToStorage, type, role, classData._id, date]);

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    // Chỉ lưu tạm thời, chưa lưu vào DB
    setTempAttendance((prev) => {
      const next = new Map(prev);
      // Toggle: nếu click lại cùng status thì bỏ chọn
      if (next.get(studentId) === status) {
        next.delete(studentId);
      } else {
        next.set(studentId, status);
      }
      return next;
    });
    setPendingStatusByStudent((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleAddTempPoints = (studentId: string, points: number) => {
    setTempScores((prev) => {
      const next = new Map(prev);
      const current = next.get(studentId) || 0;
      const profile = studentProfiles.get(studentId);
      const baseScore = profile?.currentSeasonScore || 0;
      // Nếu chưa có trong tempScores, lấy từ currentSeasonScore
      if (!prev.has(studentId)) {
        next.set(studentId, baseScore + points);
      } else {
        next.set(studentId, current + points);
      }
      return next;
    });
  };

  const handleAddTempGold = (studentId: string, gold: number) => {
    setTempGold((prev) => {
      const next = new Map(prev);
      const current = next.get(studentId) || 0;
      const profile = studentProfiles.get(studentId);
      const baseGold = profile?.gold || 0;
      // Nếu chưa có trong tempGold, lấy từ gold hiện tại
      if (!prev.has(studentId)) {
        next.set(studentId, baseGold + gold);
      } else {
        next.set(studentId, current + gold);
      }
      return next;
    });
  };

  const handleFinalizeSession = async () => {
    if (!user?._id) {
      showError("Không thể xác định giáo viên");
      return;
    }

    if (isFinalizing) {
      return; // Prevent multiple clicks
    }

    setIsFinalizing(true);

    try {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      const dateStr = formatDateLocal(checkDate);

      // CRITICAL: Refresh attendance records FIRST to get latest state from DB
      // This ensures we compare against the actual current state in database
      const refreshDateStr = formatDateLocal(checkDate);
      const refreshResponse = await fetch(
        `/api/attendance?classId=${classData._id}&sessionDate=${refreshDateStr}&_t=${Date.now()}`
      );
      let latestAttendanceRecords = attendanceRecords;
      if (refreshResponse.ok) {
        latestAttendanceRecords = await refreshResponse.json();
        // Update state immediately for next calculation
        setAttendanceRecords(latestAttendanceRecords);
        console.log(`[REFRESH] Refreshed ${latestAttendanceRecords.length} attendance records from DB`);
      } else {
        console.warn(`[REFRESH] Failed to refresh attendance records, using cached data`);
      }

      // Helper function to get attendance points
      const getAttendancePoints = (status: AttendanceStatusOrNull): number => {
        if (status === "present") return 100;
        if (status === "excused") return 50;
        if (status === "absent") return 0;
        return 0;
      };

      // Helper function to normalize attendance status for comparison
      const normalizeStatus = (status: string | null | undefined): AttendanceStatusOrNull => {
        if (!status) return null;
        const normalized = status.toLowerCase();
        if (normalized === "present") return "present";
        if (normalized === "excused") return "excused";
        if (normalized === "absent") return "absent";
        return null;
      };

      // Process all students
      const updates = studentsForDate.map((student) => {
        const studentId = student._id?.toString() || "";
        const tempScore = tempScores.get(studentId);
        const baseScore = studentProfiles.get(studentId)?.currentSeasonScore || 0;
        const pointsToAdd = tempScore !== undefined ? tempScore - baseScore : 0;
        
        const tempGoldValue = tempGold.get(studentId);
        const baseGold = studentProfiles.get(studentId)?.gold || 0;
        const goldToAdd = tempGoldValue !== undefined ? tempGoldValue - baseGold : 0;
        
        // Get attendance status from tempAttendance (new) - this is what user wants to set
        // CRITICAL: tempAttendance only has values if user clicked attendance buttons in THIS session
        // If tempAttendance doesn't have a value, it means user didn't change anything
        const newAttendanceStatusRaw = tempAttendance.get(studentId);
        const hasTempAttendance = tempAttendance.has(studentId); // Check if key exists in Map
        const newAttendanceStatus = newAttendanceStatusRaw ? normalizeStatus(newAttendanceStatusRaw) : null;
        
        // Get existing attendance from LATEST database records - this is what's currently in DB
        const existingAttendance = latestAttendanceRecords.find((att) => {
        if (att.studentId.toString() !== studentId) return false;
        const attDate = new Date(att.sessionDate);
        attDate.setHours(0, 0, 0, 0);
        return attDate.getTime() === checkDate.getTime();
      });

        const oldAttendanceStatusRaw = existingAttendance?.status;
        const oldAttendanceStatus = oldAttendanceStatusRaw ? normalizeStatus(oldAttendanceStatusRaw as AttendanceStatusOrNull) : null;
        
        // Calculate attendance points difference
        // CRITICAL LOGIC:
        // 1. If tempAttendance has NO value for this student → user didn't change anything → no points change
        // 2. If tempAttendance has a value → user clicked attendance button → calculate diff
        // 3. If newStatus === oldStatus → no change → no points change
        let attendancePointsDiff = 0;
        let statusChanged = false;
        
        // Only process if user actually interacted with attendance (tempAttendance has value)
        if (hasTempAttendance) {
          // User clicked attendance button, so there might be a change
          statusChanged = newAttendanceStatus !== oldAttendanceStatus;
          
          if (statusChanged) {
            if (newAttendanceStatus !== null) {
              // Adding new attendance or changing existing one
              const oldPoints = getAttendancePoints(oldAttendanceStatus);
              const newPoints = getAttendancePoints(newAttendanceStatus);
              attendancePointsDiff = newPoints - oldPoints;
              console.log(`[ATTENDANCE CHANGE] Student ${studentId}: ${oldAttendanceStatus} → ${newAttendanceStatus}, points: ${oldPoints} → ${newPoints}, diff: ${attendancePointsDiff}`);
            } else if (oldAttendanceStatus !== null) {
              // User explicitly removed attendance (clicked to unselect)
              const oldPoints = getAttendancePoints(oldAttendanceStatus);
              attendancePointsDiff = -oldPoints;
              console.log(`[ATTENDANCE REMOVE] Student ${studentId}: Removing ${oldAttendanceStatus}, points: -${oldPoints}`);
            }
          } else {
            // User clicked but status is same as DB (no change)
            console.log(`[ATTENDANCE NO CHANGE] Student ${studentId}: ${oldAttendanceStatus} === ${newAttendanceStatus}, attendancePointsDiff = 0`);
          }
        } else {
          // User didn't interact with attendance in this session → no change
          console.log(`[ATTENDANCE NO INTERACTION] Student ${studentId}: No tempAttendance value, keeping ${oldAttendanceStatus}, attendancePointsDiff = 0`);
        }

        console.log(`[FINALIZE] Student ${studentId}: baseScore=${baseScore}, tempScore=${tempScore}, pointsToAdd=${pointsToAdd}`);
        console.log(`[FINALIZE]   oldAttendance=${oldAttendanceStatus} (raw: ${oldAttendanceStatusRaw}), newAttendance=${newAttendanceStatus} (raw: ${newAttendanceStatusRaw}), statusChanged=${statusChanged}, attendancePointsDiff=${attendancePointsDiff}`);

        // Determine final attendance status to save
        // CRITICAL: Only save if user actually interacted with attendance (hasTempAttendance === true)
        // If user didn't interact, keep existing status and don't save
        const finalAttendanceStatus = hasTempAttendance 
          ? (newAttendanceStatus !== null ? newAttendanceStatus : oldAttendanceStatus)
          : oldAttendanceStatus; // If no interaction, keep existing
        const hasAttendanceChange = hasTempAttendance && statusChanged; // Only true if user interacted AND status changed

        return {
          studentId,
          pointsToAdd,
          goldToAdd,
          attendanceStatus: finalAttendanceStatus,
          attendancePointsDiff,
          oldAttendanceStatus,
          existingAttendanceId: existingAttendance?._id?.toString(),
          hasAttendanceChange, // Flag to indicate if attendance actually changed
        };
      });

      // Add points for all students (regular points + attendance points difference)
      const pointPromises = updates
        .filter((u) => u.pointsToAdd !== 0 || u.attendancePointsDiff !== 0) // Include if there are any point changes
        .map(async (u) => {
          try {
            const totalPoints = u.pointsToAdd + u.attendancePointsDiff;
            if (totalPoints === 0) return null; // Skip if no net change
            
            console.log(`Adding ${totalPoints} points to student ${u.studentId} (regular: ${u.pointsToAdd}, attendance diff: ${u.attendancePointsDiff})`);
            const response = await fetch(`/api/students/${u.studentId}/add-points`, {
              method: "POST",
            headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ points: totalPoints }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              console.error(`Error response for student ${u.studentId}:`, errorData);
              throw new Error(errorData?.error || `Lỗi cộng điểm cho học sinh ${u.studentId}`);
            }

            const result = await response.json();
            console.log(`Successfully added points to student ${u.studentId}:`, result);
            return result;
          } catch (error) {
            console.error(`Error adding points to student ${u.studentId}:`, error);
            throw error;
          }
        });

      await Promise.all(pointPromises.filter(p => p !== null));

      // Add gold for all students
      const goldPromises = updates
        .filter((u) => u.goldToAdd !== 0) // Include if there are any gold changes
        .map(async (u) => {
          try {
            console.log(`Adding ${u.goldToAdd} gold to student ${u.studentId}`);
            const response = await fetch(`/api/students/${u.studentId}/gold`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ operation: "add", amount: u.goldToAdd }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              console.error(`Error response for student ${u.studentId}:`, errorData);
              throw new Error(errorData?.error || `Lỗi cộng vàng cho học sinh ${u.studentId}`);
            }

            const result = await response.json();
            console.log(`Successfully added gold to student ${u.studentId}:`, result);
            return result;
          } catch (error) {
            console.error(`Error adding gold to student ${u.studentId}:`, error);
            throw error;
          }
        });

      await Promise.all(goldPromises.filter(p => p !== null));

      // Save attendance records (only if status changed or is new)
      // CRITICAL: Only save if there's an ACTUAL change from what's in DB
      const attendancePromises = updates
        .filter((u) => {
          // Use the hasAttendanceChange flag to ensure we only save when there's a real change
          // If new === old, it means user didn't change anything, so don't save again
          const hasStatusChange = (u as any).hasAttendanceChange === true;
          if (!hasStatusChange) {
            console.log(`[ATTENDANCE] Student ${u.studentId}: No status change (${u.oldAttendanceStatus} → ${u.attendanceStatus}), skipping save`);
          }
          return hasStatusChange;
        })
        .map(async (u) => {
          try {
            // Save attendance record
            if (u.existingAttendanceId) {
              // Update existing attendance
              const response = await fetch(`/api/attendance/${u.existingAttendanceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: u.attendanceStatus }),
              });

              if (!response.ok) {
          const error = await response.json();
                throw new Error(error?.error || "Lỗi cập nhật điểm danh");
        }

              return await response.json();
      } else {
        // Create new attendance
              if (!user?._id) {
                throw new Error("Không thể xác định giáo viên");
              }
        const attendanceData: CreateAttendanceData = {
                studentId: u.studentId,
          classId: classData._id?.toString(),
                sessionDate: dateStr,
                status: u.attendanceStatus!,
          markedBy: user._id.toString(),
        };

        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attendanceData),
        });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error || "Lỗi tạo điểm danh");
              }

              return await response.json();
            }
          } catch (error) {
            console.error(`Error saving attendance for student ${u.studentId}:`, error);
            throw error;
          }
        });

      await Promise.all(attendancePromises);

      // Wait a bit to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh attendance records again to get final state
      const finalRefreshDateStr = formatDateLocal(checkDate);
      const finalRefreshResponse = await fetch(
        `/api/attendance?classId=${classData._id}&sessionDate=${finalRefreshDateStr}&_t=${Date.now()}`
          );
      if (finalRefreshResponse.ok) {
        setAttendanceRecords(await finalRefreshResponse.json());
      }

      // Refresh student profiles to get updated scores
      const timestamp = Date.now();
      const studentPromises = classData.enrolledStudents.map((studentId) =>
        fetch(`/api/students/${studentId}?_t=${timestamp}`).then((res) => res.json())
      );
      const studentData = await Promise.all(studentPromises);
      
      const profileMap = new Map<string, { 
        currentSeasonScore: number; 
        lifetimeScore: number;
        gold: number;
        gradeRank: number | null;
        gradeTotal: number;
        globalRank: number | null;
        globalTotal: number;
        rank?: number;
      }>();
      
      for (const s of studentData) {
        const id = s._id?.toString();
        if (!id) continue;
        
        try {
          const profileRes = await fetch(`/api/students/${id}?_t=${timestamp}`);
          let profileData: any = {};
          if (profileRes.ok) {
            profileData = await profileRes.json();
          }

          const rankingRes = await fetch(`/api/students/ranking?studentId=${id}&_t=${timestamp}`);
          let rankingData: any = {
            gradeRank: null,
            gradeTotal: 0,
            globalRank: null,
            globalTotal: 0,
            currentSeasonScore: 0,
          };
          if (rankingRes.ok) {
            rankingData = await rankingRes.json();
          }

          profileMap.set(id, {
            currentSeasonScore: rankingData.currentSeasonScore || profileData.currentSeasonScore || 0,
            lifetimeScore: profileData.lifetimeScore || 0,
            gold: profileData.gold || 0,
            gradeRank: rankingData.gradeRank,
            gradeTotal: rankingData.gradeTotal,
            globalRank: rankingData.globalRank,
            globalTotal: rankingData.globalTotal,
            rank: undefined,
          });
        } catch (error) {
          console.error(`Error refreshing profile for student ${id}:`, error);
        }
      }
      
      setStudentProfiles(profileMap);

      // Clear temporary data and localStorage
      setTempScores(new Map());
      setTempGold(new Map());
      setTempAttendance(new Map());
      setTempInputValues(new Map());
      setTempGoldInputValues(new Map());
      const storageKey = `class_session_${classData._id?.toString()}_${date.toISOString().split('T')[0]}`;
      localStorage.removeItem(storageKey);

      showSuccess("Đã tổng kết buổi học thành công");
      
      // Notify parent component to refresh attendance records
      if (onAttendanceUpdated) {
        onAttendanceUpdated();
      }
    } catch (error) {
      console.error("Error finalizing session:", error);
      const errorMessage = error instanceof Error ? error.message : "Lỗi tổng kết buổi học";
      showError(errorMessage);
    } finally {
      setIsFinalizing(false);
    }
  };

  const palette = [
    { bg: "#f4d06f", border: "#d4b05f" }, // Top 1
    { bg: "#c9ccd6", border: "#a9acb6" }, // Top 2
    { bg: "#e6b8a2", border: "#c69882" }, // Top 3
    { bg: "#b6c4d9", border: "#96a4b9" }, // Top 4
    { bg: "#b8e0d2", border: "#98c0b2" }, // Top 5
  ];

  const statusTint = (s: AttendanceStatusOrNull) => {
    if (s === "present") return { bg: "rgba(16,185,129,0.09)", border: "rgba(16,185,129,0.35)" };
    if (s === "excused") return { bg: "rgba(245,158,11,0.09)", border: "rgba(245,158,11,0.35)" };
    if (s === "absent") return { bg: "rgba(220,38,38,0.09)", border: "rgba(220,38,38,0.35)" };
    return { bg: "white", border: "rgba(0,0,0,0.10)" };
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] transition-opacity"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
      aria-label={getTitle()}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl transition-all transform ${
          type === "attendance" && role === "teacher"
            ? "max-w-7xl w-full mx-4 h-[95vh] flex flex-col"
            : "max-w-lg w-full mx-4 p-6"
        }`}
        style={{ borderColor: colors.brown, borderWidth: "2px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b ${
            type === "attendance" && role === "teacher"
              ? "pt-2 pb-2 flex-shrink-0"
              : "mb-2 pb-2"
          }`}
          style={{ borderColor: colors.light }}
        >
          {type === "attendance" && role === "teacher" ? (
            <div className="flex w-full">
              {/* Vùng trái header - flex-1 với border-r, padding match với body */}
              <div className="flex-1 flex items-center px-6 border-r" style={{ borderColor: colors.light }}>
                <div className="flex items-center gap-3 flex-1">
          <button
                    onClick={requestClose}
                    className="text-gray-600 hover:text-gray-800 transition-colors text-xl cursor-pointer hover:scale-110"
                    aria-label="Quay lại"
                  >
                    ←
          </button>
                  <h3 className="text-2xl font-bold" style={{ color: colors.darkBrown }}>
                    Điểm danh ngày{" "}
                    {date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                  </h3>
                  {savingAttendance && (
                    <div className="ml-3 flex items-center gap-2 text-sm" style={{ color: colors.brown }}>
                      <Spinner />
                      <span>Đang lưu...</span>
        </div>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  {/* Sort button */}
                  <div className="relative" ref={sortDropdownRef}>
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-90 whitespace-nowrap cursor-pointer hover:bg-gray-50"
              style={{
                        backgroundColor: "transparent",
                        color: colors.darkBrown,
              }}
            >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                style={{ color: colors.darkBrown }}
              >
                        <path
                          d="M2 4h12M4 8h8M6 12h4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-lg">Sắp xếp</span>
                    </button>
                    {showSortDropdown && (
                  <div
                        className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border-2 z-50 min-w-[180px]"
                        style={{ borderColor: colors.light }}
                  >
                        <button
                          onClick={() => {
                            setSortOrder("asc");
                            setShowSortDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-t-lg cursor-pointer"
                    style={{ color: colors.darkBrown }}
                  >
                          Điểm tăng dần
                        </button>
                        <button
                          onClick={() => {
                            setSortOrder("desc");
                            setShowSortDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-b-lg cursor-pointer"
                    style={{ color: colors.darkBrown }}
                  >
                          Điểm giảm dần
                        </button>
                  </div>
                    )}
                </div>
                  <button
                    onClick={handleFinalizeSession}
                    disabled={isFinalizing}
                    className=" cursor-pointer px-3 py-1 rounded-xl font-semibold text-lg transition-all whitespace-nowrap hover:shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    style={{
                      backgroundColor: "white",
                      color: colors.darkBrown,
                      border: `2px solid ${colors.brown}`,
                    }}
                  >
                    {isFinalizing ? "Đang tổng kết..." : "Tổng kết"}
                  </button>
                  </div>
                  </div>
              {/* Vùng phải header - canh với cột ranking, padding match với body */}
              <div className="flex-shrink-0 flex items-center justify-center p-4" style={{ width: `${rightSideWidth}px` }}>
                <div className="text-2xl font-semibold tracking-wide" style={{ color: colors.darkBrown }}>
                  TOP XẾP HẠNG LỚP
                </div>
                  </div>
                  </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold" style={{ color: colors.darkBrown }}>
                {getTitle()}
              </h3>
              <button
                onClick={requestClose}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer hover:scale-110"
                style={{ fontSize: "24px", lineHeight: "1" }}
                aria-label="Đóng"
              >
                ×
              </button>
            </>
          )}
            </div>

        {type === "attendance" && role === "teacher" ? (
          <div className="flex-1 overflow-hidden flex" ref={resizeRef}>
            {/* Left side */}
            <div className="flex-1 overflow-hidden flex flex-col border-r" style={{ borderColor: colors.light }}>
              {loadingStudents ? (
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  <div className="space-y-3 animate-pulse mt-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-24 rounded-2xl border" style={{ backgroundColor: colors.light }} />
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
                  <div className="space-y-3">
                    {studentsForDate.map((student) => {
                              const studentId = student._id?.toString() || "";
                      const currentStatus = getAttendanceStatus(studentId);
                      const tempStatus = tempAttendance.get(studentId);
                      const pending = pendingStatusByStudent[studentId] ?? null;
                      const displayedStatus = tempStatus ?? pending ?? currentStatus;

                              const isSaving = savingAttendance === studentId;
                      const profile = studentProfiles.get(studentId);
                      const currentSeasonScore = profile?.currentSeasonScore || 0;

                      const studentRank = classRanking.findIndex((s) => s._id?.toString() === studentId) + 1;
                      const highlighted = highlightStudentId === studentId;
                      const tint = statusTint(displayedStatus);
                      const dimOthers = displayedStatus !== null;

                              return (
                                <div
                                  key={studentId}
                          ref={(el) => {
                            rowRefs.current.set(studentId, el);
                          }}
                          className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md"
                                  style={{
                            backgroundColor: tint.bg,
                            borderColor: highlighted ? colors.darkBrown : tint.border,
                            boxShadow: highlighted ? "0 10px 22px rgba(0,0,0,0.10)" : undefined,
                          }}
                          onMouseEnter={(e) => {
                            if (!highlighted) {
                              e.currentTarget.style.borderColor = colors.brown;
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!highlighted) {
                              e.currentTarget.style.borderColor = tint.border;
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                                  }}
                                >
                          {/* Avatar + name + small stats */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 relative">
                              {student.avatar ? (
                                <img
                                  src={student.avatar}
                                  alt={student.fullName}
                                  className="w-16 h-16 rounded-full object-cover border-2 transition-all cursor-pointer hover:scale-110 hover:shadow-md"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                />
                              ) : (
                                    <div
                                  className="w-16 h-16 rounded-full border-2 flex items-center justify-center font-bold transition-all cursor-pointer hover:scale-110 hover:shadow-md"
                                      style={{
                                    backgroundColor: "rgba(255,255,255,0.65)",
                                    borderColor: "rgba(0,0,0,0.10)",
                                    color: colors.darkBrown,
                                      }}
                                    >
                                  {getInitials(student.fullName)}
                                    </div>
                              )}

                              {isSaving && (
                                <div
                                  className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                >
                                  <Spinner className="w-3.5 h-3.5" />
                                </div>
                              )}

                              {recentlySavedByStudent[studentId] && !isSaving && (
                                <div
                                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border flex items-center justify-center text-[12px] font-black"
                                  style={{ borderColor: "rgba(0,0,0,0.10)", color: "#10B981" }}
                                  aria-label="Đã lưu"
                                >
                                  ✓
                                  </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base mb-1 truncate" style={{ color: colors.darkBrown }}>
                                {student.fullName}
                              </div>
                              <div className="text-xs leading-snug flex items-center gap-2" style={{ color: "rgba(108,88,76,0.75)" }}>
                                {/* xx/yy: thứ hạng theo khối / thứ hạng toàn server */}
                                <span>
                                  {(() => {
                                    const xx = profile?.gradeRank || "-";
                                    const yy = profile?.globalRank || "-";
                                    return `${xx}/${yy}`;
                                  })()}
                                </span>
                                <span>•</span>
                                {/* Vàng tích lũy */}
                                <span>{profile?.gold || 0}</span>
                                <span>•</span>
                                {/* Điểm tích lũy theo mùa */}
                                <span>{currentSeasonScore}</span>
                              </div>
                            </div>
                          </div>

                          {/* Middle score - điểm tạm thời và vàng tạm thời */}
                          <div className="flex-shrink-0 text-center px-3">
                            <div className="text-xl font-black flex items-center justify-center gap-1" style={{ color: colors.darkBrown }}>
                              {(() => {
                                const tempScore = tempScores.get(studentId);
                                return tempScore !== undefined ? tempScore : currentSeasonScore;
                              })()}
                              <span className="text-lg">⭐</span>
                            </div>
                            <div className="text-sm font-medium flex items-center justify-center gap-1 opacity-60" style={{ color: colors.darkBrown }}>
                              {(() => {
                                const tempGoldValue = tempGold.get(studentId);
                                const baseGold = profile?.gold || 0;
                                return tempGoldValue !== undefined ? tempGoldValue : baseGold;
                              })()}
                              <span className="text-xs">🪙</span>
                            </div>
                          </div>

                          {/* Right actions */}
                                  {type === "attendance" && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <input
                                ref={(el) => {
                                  goldInputRefs.current.set(studentId, el);
                                }}
                                type="text"
                                className="w-10 h-10 rounded-full border-2 text-center text-sm font-semibold transition-all cursor-text hover:border-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1"
                                        style={{
                                  borderColor: colors.brown, 
                                  color: colors.darkBrown, 
                                  backgroundColor: "white",
                                        }}
                                aria-label="Input tròn (vàng)"
                                value={tempGoldInputValues.get(studentId) || ""}
                                onChange={(e) => {
                                  // Chỉ cho phép nhập số, dấu trừ ở đầu, và dấu chấm (cho số thập phân)
                                  const value = e.target.value;
                                  const validPattern = /^-?\d*(\.\d*)?$/;
                                  
                                  // Cho phép chuỗi rỗng hoặc chuỗi chỉ có dấu trừ (đang nhập)
                                  if (value === "" || value === "-" || validPattern.test(value)) {
                                    setTempGoldInputValues((prev) => {
                                      const next = new Map(prev);
                                      next.set(studentId, value);
                                      return next;
                                    });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const value = e.currentTarget.value.trim();
                                    const gold = parseFloat(value);
                                    // Cho phép số âm, số dương, và 0
                                    if (!isNaN(gold) && value !== "" && value !== "-") {
                                      handleAddTempGold(studentId, gold);
                                      setTempGoldInputValues((prev) => {
                                        const next = new Map(prev);
                                        next.set(studentId, "");
                                        return next;
                                      });
                                    }
                                    
                                    // Tự động chuyển focus xuống học sinh tiếp theo
                                    const currentIndex = studentsForDate.findIndex(
                                      (s) => s._id?.toString() === studentId
                                    );
                                    if (currentIndex >= 0 && currentIndex < studentsForDate.length - 1) {
                                      const nextStudent = studentsForDate[currentIndex + 1];
                                      const nextStudentId = nextStudent._id?.toString() || "";
                                      const nextInput = goldInputRefs.current.get(nextStudentId);
                                      if (nextInput) {
                                        // Delay nhỏ để đảm bảo state đã được cập nhật
                                        setTimeout(() => {
                                          nextInput.focus();
                                          nextInput.select(); // Chọn toàn bộ text để dễ nhập lại
                                        }, 0);
                                      }
                                    } else {
                                      // Nếu là học sinh cuối cùng, blur
                                      e.currentTarget.blur();
                                    }
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = colors.mediumGreen;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = colors.brown;
                                }}
                              />
                              <input
                                ref={(el) => {
                                  inputRefs.current.set(studentId, el);
                                }}
                                type="text"
                                className="w-12 h-10 rounded border-2 text-center text-sm font-semibold transition-all cursor-text hover:border-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1"
                                        style={{
                                  borderColor: colors.brown, 
                                  color: colors.darkBrown, 
                                  backgroundColor: "white",
                                        }}
                                aria-label="Input chữ nhật"
                                value={tempInputValues.get(studentId) || ""}
                                onChange={(e) => {
                                  // Chỉ cho phép nhập số, dấu trừ ở đầu, và dấu chấm (cho số thập phân)
                                  const value = e.target.value;
                                  // Regex: cho phép số âm, số dương, và số thập phân
                                  // ^-? - dấu trừ ở đầu (tùy chọn)
                                  // \d* - các chữ số (có thể không có)
                                  // (\.\d*)? - dấu chấm và các chữ số sau dấu chấm (tùy chọn)
                                  const validPattern = /^-?\d*(\.\d*)?$/;
                                  
                                  // Cho phép chuỗi rỗng hoặc chuỗi chỉ có dấu trừ (đang nhập)
                                  if (value === "" || value === "-" || validPattern.test(value)) {
                                    setTempInputValues((prev) => {
                                      const next = new Map(prev);
                                      next.set(studentId, value);
                                      return next;
                                    });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const value = e.currentTarget.value.trim();
                                    const points = parseFloat(value);
                                    // Cho phép số âm, số dương, và 0
                                    if (!isNaN(points) && value !== "" && value !== "-") {
                                      handleAddTempPoints(studentId, points);
                                      setTempInputValues((prev) => {
                                        const next = new Map(prev);
                                        next.set(studentId, "");
                                        return next;
                                      });
                                    }
                                    
                                    // Tự động chuyển focus xuống học sinh tiếp theo
                                    const currentIndex = studentsForDate.findIndex(
                                      (s) => s._id?.toString() === studentId
                                    );
                                    if (currentIndex >= 0 && currentIndex < studentsForDate.length - 1) {
                                      const nextStudent = studentsForDate[currentIndex + 1];
                                      const nextStudentId = nextStudent._id?.toString() || "";
                                      const nextInput = inputRefs.current.get(nextStudentId);
                                      if (nextInput) {
                                        // Delay nhỏ để đảm bảo state đã được cập nhật
                                        setTimeout(() => {
                                          nextInput.focus();
                                          nextInput.select(); // Chọn toàn bộ text để dễ nhập lại
                                        }, 0);
                                      }
                                    } else {
                                      // Nếu là học sinh cuối cùng, blur
                                      e.currentTarget.blur();
                                    }
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = colors.mediumGreen;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = colors.brown;
                                }}
                              />

                              <StatusPill
                                label="C"
                                active={displayedStatus === "present"}
                                dimmed={dimOthers && displayedStatus !== "present"}
                                disabled={!!savingAttendance && !isSaving}
                                saving={isSaving}
                                onClick={() => handleMarkAttendance(studentId, "present")}
                                bg={{ on: "#10B981", off: "#D1FAE5" }}
                                fg={{ on: "white", off: "#065F46" }}
                              />
                              <StatusPill
                                label="P"
                                active={displayedStatus === "excused"}
                                dimmed={dimOthers && displayedStatus !== "excused"}
                                disabled={!!savingAttendance && !isSaving}
                                saving={isSaving}
                                onClick={() => handleMarkAttendance(studentId, "excused")}
                                bg={{ on: "#F59E0B", off: "#FEF3C7" }}
                                fg={{ on: "white", off: "#92400E" }}
                              />
                              <StatusPill
                                label="K"
                                active={displayedStatus === "absent"}
                                dimmed={dimOthers && displayedStatus !== "absent"}
                                disabled={!!savingAttendance && !isSaving}
                                saving={isSaving}
                                onClick={() => handleMarkAttendance(studentId, "absent")}
                                bg={{ on: "#DC2626", off: "#FEE2E2" }}
                                fg={{ on: "white", off: "#991B1B" }}
                              />
                                    </div>
                                  )}
                                </div>
                              );
                    })}

                    {studentsForDate.length === 0 && (
                      <div className="text-center py-10 rounded-2xl border-2"
                        style={{ borderColor: colors.light, color: colors.brown, backgroundColor: "white" }}
                      >
                        <div className="text-sm">Chưa có học viên đăng ký</div>
                      </div>
                          )}
                        </div>
                      </div>
                    )}
            </div>

            {/* Resizer handle */}
                        <div
              className="flex-shrink-0 cursor-col-resize relative group"
              style={{ 
                width: '1px',
                backgroundColor: isResizing ? colors.brown : 'transparent',
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              onMouseEnter={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.backgroundColor = colors.light;
                }
              }}
              onMouseLeave={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4" />
                        </div>

            {/* Right side - Ranking */}
            <div className="flex-shrink-0 p-4 overflow-y-auto" style={{ backgroundColor: "white", width: `${rightSideWidth}px` }}>
              {classRanking.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border-2" style={{ borderColor: colors.light, color: colors.brown }}>
                  <div className="text-sm">Chưa có dữ liệu xếp hạng</div>
                </div>
              ) : (
                <>
                  {/* Avatar Ranking */}
                  <div className="mb-15 mt-10">
                    {(() => {
                      const top5 = classRanking.slice(0, 5);
                      
                      // Size cho từng rank
                      const sizeByRank: Record<number, number> = {
                        1: 120, // To nhất
                        2: 90,  // Nhỏ hơn 1, to hơn 4-5
                        3: 90,  // Nhỏ hơn 1, to hơn 4-5
                        4: 75,  // Nhỏ nhất
                        5: 75,  // Nhỏ nhất
                      };

                      const renderAvatar = (rankNumber: number, size: number) => {
                        const student = top5[rankNumber - 1];
                        const id = student?._id?.toString() || "";
                        const color = palette[rankNumber - 1] || palette[4];
                        const meta = id ? rankMetaById[id] : null;
                        const ringClass = meta?.flash
                          ? meta.moved === "up"
                            ? "ring-2 ring-emerald-400/60"
                            : meta.moved === "down"
                            ? "ring-2 ring-rose-400/60"
                            : "ring-2 ring-black/10"
                          : "";

                            return (
                          <motion.div
                            key={id || `rank-${rankNumber}`}
                            layout
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            className={`relative cursor-pointer transition-transform hover:scale-105 ${ringClass}`}
                            title={student ? `${student.fullName} (#${rankNumber})` : `#${rankNumber}`}
                            onMouseEnter={() => {
                              if (!id) return;
                              setHighlightStudentId(id);
                              scrollToStudent(id);
                            }}
                            onMouseLeave={() => setHighlightStudentId(null)}
                          >
                            {/* Avatar */}
                            {student?.avatar ? (
                              <img
                                src={student.avatar}
                                alt={student.fullName}
                                className="rounded-full object-cover"
                                style={{
                                  width: size,
                                  height: size,
                                  border: `4px solid ${color.border}`,
                                  boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                                }}
                              />
                            ) : (
                              <div
                                className="rounded-full flex items-center justify-center font-black"
                                style={{
                                  width: size,
                                  height: size,
                                  border: `4px solid ${color.border}`,
                                  backgroundColor: color.bg,
                                  color: colors.darkBrown,
                                  boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                                }}
                              >
                                {getInitials(student?.fullName)}
                              </div>
                            )}
                            
                            {/* Badge số */}
                                  <div
                              className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-black text-white"
                                    style={{
                                bottom: -(size * 0.35) / 2,
                                width: size * 0.35,
                                height: size * 0.35,
                                backgroundColor: color.border,
                                border: "3px solid white",
                                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                fontSize: size * 0.25,
                                    }}
                                  >
                              {rankNumber}
                                  </div>
                          </motion.div>
                        );
                      };

                      return (
                        <div className="flex flex-col items-center gap-4">
                          {/* Hàng trên: Top 2, Top 1, Top 3 */}
                          <div className="flex items-end justify-center gap-6">
                            {renderAvatar(2, sizeByRank[2])}
                            {renderAvatar(1, sizeByRank[1])}
                            {renderAvatar(3, sizeByRank[3])}
                                </div>
                          
                          {/* Hàng dưới: Top 4, Top 5 */}
                          <div className="flex items-center justify-center gap-8">
                            {renderAvatar(4, sizeByRank[4])}
                            {renderAvatar(5, sizeByRank[5])}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <AnimatePresence initial={false}>
                    {classRanking[0] && (() => {
                      const id = classRanking[0]._id?.toString() || "";
                      const meta = id ? rankMetaById[id] : null;
                      const ringClass = meta?.flash
                        ? meta.moved === "up"
                          ? "ring-2 ring-emerald-400/60"
                          : meta.moved === "down"
                          ? "ring-2 ring-rose-400/60"
                          : "ring-2 ring-black/10"
                        : "";
                      const badge = meta?.flash && meta.moved !== "same" ? (
                        <span className={`text-xs font-bold ml-2 ${meta.moved === "up" ? "text-emerald-600" : "text-rose-600"}`}>
                          {meta.moved === "up" ? "▲" : "▼"}
                        </span>
                      ) : meta?.flash && meta.deltaScore !== 0 ? (
                        <span className="text-xs font-bold ml-2 text-gray-600">
                          {meta.deltaScore > 0 ? "+" : ""}{meta.deltaScore}
                        </span>
                      ) : null;

                      return (
                        <motion.div
                          key={id}
                          layout
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          className={`rounded-2xl border-2 p-3 mb-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${ringClass}`}
                                      style={{
                            backgroundColor: palette[0].bg, 
                            borderColor: palette[0].border,
                                      }}
                          onMouseEnter={() => {
                            if (!id) return;
                            setHighlightStudentId(id);
                            scrollToStudent(id);
                          }}
                          onMouseLeave={() => setHighlightStudentId(null)}
                        >
                          <div className="flex items-center gap-7">
                            <div className="text-[44px] leading-none font-black" style={{ color: colors.darkBrown }}>
                              1
                                  </div>
                            <div className="text-xl flex-1 min-w-0 font-semibold truncate flex items-center" style={{ color: colors.darkBrown }}>
                              {classRanking[0].fullName}
                              {badge}
                              </div>
                            <div className="flex-shrink-0 text-sm font-medium" style={{ color: colors.darkBrown }}>
                              {classRanking[0].currentSeasonScore}
                        </div>
                      </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>

                  <AnimatePresence initial={false}>
                    <div className="space-y-3">
                      {classRanking.slice(1, 5).map((s, idx) => {
                        const rank = idx + 2;
                        const color = palette[rank - 1] || palette[4];
                        const id = s._id?.toString() || "";
                        const meta = id ? rankMetaById[id] : null;
                        const ringClass = meta?.flash
                          ? meta.moved === "up"
                            ? "ring-2 ring-emerald-400/60"
                            : meta.moved === "down"
                            ? "ring-2 ring-rose-400/60"
                            : "ring-2 ring-black/10"
                          : "";
                        const badge = meta?.flash && meta.moved !== "same" ? (
                          <span className={`text-xs font-bold ml-2 ${meta.moved === "up" ? "text-emerald-600" : "text-rose-600"}`}>
                            {meta.moved === "up" ? "▲" : "▼"}
                          </span>
                        ) : meta?.flash && meta.deltaScore !== 0 ? (
                          <span className="text-xs font-bold ml-2 text-gray-600">
                            {meta.deltaScore > 0 ? "+" : ""}{meta.deltaScore}
                          </span>
                        ) : null;

                        return (
                          <motion.div
                            key={id}
                            layout
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            className="flex items-center gap-3 cursor-pointer transition-all"
                            onMouseEnter={() => {
                              if (!id) return;
                              setHighlightStudentId(id);
                              scrollToStudent(id);
                            }}
                            onMouseLeave={() => setHighlightStudentId(null)}
                        >
                            <div className="ml-3 w-8 text-[42px] leading-none font-black transition-all" style={{ color: colors.darkBrown }}>
                              {rank}
                          </div>
                            <motion.div 
                              layout
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                              className={`ml-[-10px] flex-1 rounded-2xl border-2 px-3 py-2 flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-md ${ringClass}`}
                              style={{ backgroundColor: color.bg, borderColor: color.border }}
                            >
                              <div className="font-semibold truncate flex items-center" style={{ color: colors.darkBrown }}>
                                {s.fullName}
                                {badge}
                        </div>
                              <div className="flex-shrink-0 text-sm font-medium ml-3" style={{ color: colors.darkBrown }}>
                                {s.currentSeasonScore}
                  </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                </div>
                  </AnimatePresence>

                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Content for other modal types kept as-is (trimmed here for brevity in refactor) */}
            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: colors.mediumGreen }} />
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.brown }}>
                    Tên lớp
                  </div>
                  <div className="text-base font-medium" style={{ color: colors.darkBrown }}>
                    {classData.name}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: colors.mediumGreen }} />
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.brown }}>
                    Ngày học
                  </div>
                  <div className="text-base font-medium" style={{ color: colors.darkBrown }}>
                    {date.toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: colors.mediumGreen }} />
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.brown }}>
                    Thời gian
                  </div>
                  <div className="text-base font-medium" style={{ color: colors.darkBrown }}>
                    {(() => {
                      const dayOfWeek = date.getDay();
                      const session = classData.sessions?.find((s) => s.dayOfWeek === dayOfWeek);
                      if (session) return `${session.startTime} - ${session.endTime}`;
                      if (classData.sessions && classData.sessions.length > 0) {
                        const firstSession = classData.sessions[0];
                        return `${firstSession.startTime} - ${firstSession.endTime}`;
                      }
                      return "N/A";
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {(type === "cancel" || type === "absence") && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.darkBrown }}>
              Lý do
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded"
              style={{ borderColor: colors.brown, color: colors.darkBrown }}
              rows={3}
              placeholder="Nhập lý do..."
            />
          </div>
        )}


        <div className="flex justify-between items-center gap-3 py-3 px-6 border-t flex-shrink-0" style={{ borderColor: colors.light }}>
          <div className="text-lg font-semibold flex items-center" style={{ color: colors.darkBrown }}>
            Lớp: {classData.name}
          </div>
          <div className="flex gap-3">
            {type === "attendance" && role === "teacher" ? (
            <button
                onClick={requestClose}
                className="px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md hover:opacity-90"
                style={{ backgroundColor: colors.brown }}
            >
              Đóng
            </button>
          ) : (
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.mediumGreen }}
                disabled={(type === "cancel" || type === "absence") && !reason.trim()}
              >
                {type === "cancel" || type === "absence" ? "Xác nhận" : "Đóng"}
              </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
