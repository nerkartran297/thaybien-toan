"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Class } from "@/models/Class";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { Attendance, CreateAttendanceData } from "@/models/Attendance";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/lib/toast";

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
  onRequestMakeup?: (classId: string, date: Date, reason: string) => void;
  makeupRequests?: Array<{
    newClassId?: string;
    newSessionDate: Date;
    status?: string;
  }>;
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
  onRequestMakeup,
  makeupRequests = [],
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
    "cancel" | "absence" | "makeup" | "create" | "attendance"
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
    type: "cancel" | "absence" | "makeup" | "attendance"
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
          <button
            onClick={goToToday}
            className="rounded-lg px-4 py-2 hover:bg-[#DDE5B6] transition-colors font-medium"
            style={{ color: colors.darkBrown }}
          >
            Hôm nay
          </button>
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

                      const remainingMakeupSessions =
                        role === "student" && enrollment && studentId
                          ? (() => {
                              const excusedAbsences = attendanceRecords.filter(
                                (att) =>
                                  att.studentId?.toString() === studentId &&
                                  att.status === "excused"
                              ).length;
                              const approvedMakeups = makeupRequests.filter(
                                (m) => !m.status || m.status === "approved"
                              ).length;
                              return Math.max(
                                0,
                                excusedAbsences - approvedMakeups
                              );
                            })()
                          : 0;

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
                                  if (att.status !== "excused") return false;
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

                      const makeupCountForDate =
                        role === "teacher"
                          ? makeupRequests.filter((req) => {
                              if (req.newClassId !== cls._id?.toString())
                                return false;
                              const makeupDate = new Date(req.newSessionDate);
                              makeupDate.setHours(0, 0, 0, 0);
                              const checkDate = new Date(date);
                              checkDate.setHours(0, 0, 0, 0);
                              return (
                                makeupDate.getTime() === checkDate.getTime()
                              );
                            }).length
                          : 0;

                      // All classes repeat weekly, so check if this date matches makeup request date
                      const isMakeupClass =
                        role === "student" &&
                        studentId &&
                        makeupRequests.some((req) => {
                          if (!req.newClassId) return false;
                          if (req.newClassId !== cls._id?.toString())
                            return false;
                          const makeupDate = new Date(req.newSessionDate);
                          makeupDate.setHours(0, 0, 0, 0);
                          const checkDate = new Date(date);
                          checkDate.setHours(0, 0, 0, 0);
                          return makeupDate.getTime() === checkDate.getTime();
                        });

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
                      if (role === "teacher") {
                        studentCountForDate =
                          validEnrolledStudents.length -
                          absenceCountForDate +
                          makeupCountForDate;
                      } else if (role === "student") {
                        if (isEnrolled && hasAbsenceRequest) {
                          studentCountForDate -= 1;
                        }
                        if (isMakeupClass) {
                          studentCountForDate += 1;
                        }
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
                                  : isMakeupClass
                                  ? "var(--class-makeup)"
                                  : isEnrolled
                                  ? "var(--class-regular)"
                                  : isFull
                                  ? "var(--class-full)"
                                  : "var(--class-available)"
                                : isCancelledOnDate
                                ? "var(--teacher-class-cancelled)"
                                : isFull
                                ? "var(--teacher-class-full)"
                                : "var(--teacher-class-available)",
                            color:
                              role === "student"
                                ? isCancelledOnDate
                                  ? "var(--text-cancelled)"
                                  : hasAbsenceRequest
                                  ? "var(--text-absence)"
                                  : isMakeupClass
                                  ? "var(--text-makeup)"
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
                                  {!isEnrolled &&
                                    !isPastClass &&
                                    !isCancelledOnDate && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (onRequestMakeup) {
                                            onRequestMakeup(
                                              cls._id!.toString(),
                                              date,
                                              remainingMakeupSessions.toString()
                                            );
                                          }
                                        }}
                                        className="text-xs px-3 py-1.5 rounded hover:bg-blue-500 hover:text-white transition-colors whitespace-nowrap"
                                        style={{
                                          backgroundColor: colors.mediumGreen,
                                          color: "white",
                                        }}
                                      >
                                        Học bù
                                      </button>
                                    )}
                                </div>
                              )}

                            {role === "teacher" && (
                              <div className="text-xs space-y-1 px-1">
                                <div
                                  className="break-words"
                                  style={{
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                  }}
                                >
                                  {studentCountForDate} học sinh
                                </div>
                                {role === "teacher" &&
                                  (absenceCountForDate > 0 ||
                                    makeupCountForDate > 0) && (
                                    <div
                                      className="text-[10px] opacity-75 break-words"
                                      style={{
                                        wordBreak: "break-word",
                                        overflowWrap: "break-word",
                                      }}
                                    >
                                      {absenceCountForDate > 0 && (
                                        <span>
                                          Vắng: {absenceCountForDate}{" "}
                                        </span>
                                      )}
                                      {makeupCountForDate > 0 && (
                                        <span>Bù: {makeupCountForDate}</span>
                                      )}
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

                      const remainingMakeupSessions =
                        role === "student" && enrollment && studentId
                          ? (() => {
                              const excusedAbsences = attendanceRecords.filter(
                                (att) =>
                                  att.studentId?.toString() === studentId &&
                                  att.status === "excused"
                              ).length;
                              const approvedMakeups = makeupRequests.filter(
                                (m) => !m.status || m.status === "approved"
                              ).length;
                              return Math.max(
                                0,
                                excusedAbsences - approvedMakeups
                              );
                            })()
                          : 0;

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
                                  if (att.status !== "excused") return false;
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

                      const makeupCountForDate =
                        role === "teacher"
                          ? makeupRequests.filter((req) => {
                              if (req.newClassId !== cls._id?.toString())
                                return false;
                              const makeupDate = new Date(req.newSessionDate);
                              makeupDate.setHours(0, 0, 0, 0);
                              const checkDate = new Date(date);
                              checkDate.setHours(0, 0, 0, 0);
                              return (
                                makeupDate.getTime() === checkDate.getTime()
                              );
                            }).length
                          : 0;

                      const isMakeupClass =
                        role === "student" &&
                        studentId &&
                        makeupRequests.some((req) => {
                          if (!req.newClassId) return false;
                          if (req.newClassId !== cls._id?.toString())
                            return false;
                          const makeupDate = new Date(req.newSessionDate);
                          makeupDate.setHours(0, 0, 0, 0);
                          const checkDate = new Date(date);
                          checkDate.setHours(0, 0, 0, 0);
                          return makeupDate.getTime() === checkDate.getTime();
                        });

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
                      if (role === "teacher") {
                        studentCountForDate =
                          validEnrolledStudents.length -
                          absenceCountForDate +
                          makeupCountForDate;
                      } else if (role === "student") {
                        if (isEnrolled && hasAbsenceRequest) {
                          studentCountForDate -= 1;
                        }
                        if (isMakeupClass) {
                          studentCountForDate += 1;
                        }
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
                                  : isMakeupClass
                                  ? "var(--class-makeup)"
                                  : isEnrolled
                                  ? "var(--class-regular)"
                                  : isFull
                                  ? "var(--class-full)"
                                  : "var(--class-available)"
                                : isCancelledOnDate
                                ? "var(--teacher-class-cancelled)"
                                : isFull
                                ? "var(--teacher-class-full)"
                                : "var(--teacher-class-available)",
                            color:
                              role === "student"
                                ? isCancelledOnDate
                                  ? "var(--text-cancelled)"
                                  : hasAbsenceRequest
                                  ? "var(--text-absence)"
                                  : isMakeupClass
                                  ? "var(--text-makeup)"
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
                                  {!isEnrolled &&
                                    !isPastClass &&
                                    !isCancelledOnDate && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (onRequestMakeup) {
                                            onRequestMakeup(
                                              cls._id!.toString(),
                                              date,
                                              remainingMakeupSessions.toString()
                                            );
                                          }
                                        }}
                                        className="text-xs px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition-colors whitespace-nowrap"
                                        style={{
                                          backgroundColor: colors.mediumGreen,
                                          color: "white",
                                        }}
                                      >
                                        Học bù
                                      </button>
                                    )}
                                </div>
                              )}

                            {role === "teacher" && (
                              <div className="text-xs space-y-0.5 px-0.5">
                                <div
                                  className="break-words"
                                  style={{
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                  }}
                                >
                                  {studentCountForDate} học sinh
                                </div>
                                {role === "teacher" &&
                                  (absenceCountForDate > 0 ||
                                    makeupCountForDate > 0) && (
                                    <div
                                      className="text-[9px] opacity-75 break-words"
                                      style={{
                                        wordBreak: "break-word",
                                        overflowWrap: "break-word",
                                      }}
                                    >
                                      {absenceCountForDate > 0 && (
                                        <span>
                                          Vắng: {absenceCountForDate}{" "}
                                        </span>
                                      )}
                                      {makeupCountForDate > 0 && (
                                        <span>Bù: {makeupCountForDate}</span>
                                      )}
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
          onRequestMakeup={onRequestMakeup}
          attendanceRecords={attendanceRecords}
          makeupRequests={makeupRequests}
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
        ${disabled ? "cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"}
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
  type: "cancel" | "absence" | "makeup" | "create" | "attendance";
  classData: Class;
  date: Date;
  onClose: () => void;
  onCancelClass?: (classId: string, date: Date) => void;
  onEditClass?: (classId: string) => void;
  onRequestAbsence?: (classId: string, date: Date, reason: string) => void;
  onRequestMakeup?: (classId: string, date: Date, reason: string) => void;
  attendanceRecords?: Array<{
    sessionDate: Date;
    studentId?: string;
    classId?: string;
    status?: string;
  }>;
  makeupRequests?: Array<{
    newClassId?: string;
    newSessionDate: Date;
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
  onRequestMakeup,
  attendanceRecords: propAttendanceRecords = [],
  makeupRequests = [],
  role,
}: ClassActionModalProps) {
  const [reason, setReason] = useState("");
  const [students, setStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [makeupStudents, setMakeupStudents] = useState<User[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [savingAttendance, setSavingAttendance] = useState<string | null>(null);

  // UX state
  const [highlightStudentId, setHighlightStudentId] = useState<string | null>(null);
  const [pendingStatusByStudent, setPendingStatusByStudent] = useState<Record<string, AttendanceStatusOrNull>>({});
  const [recentlySavedByStudent, setRecentlySavedByStudent] = useState<Record<string, boolean>>({});

  const rowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const [studentProfiles, setStudentProfiles] = useState<
    Map<string, { competitionScore: number; rank?: number }>
  >(new Map());

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

          // Placeholder profiles (logic later)
          const profileMap = new Map<string, { competitionScore: number; rank?: number }>();
          studentData.forEach((s: User) => {
            const id = s._id?.toString();
            if (id) profileMap.set(id, { competitionScore: 0, rank: undefined });
          });
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

  // Fetch makeup students
  useEffect(() => {
    if (type === "attendance" && role === "teacher") {
      const fetchMakeupStudents = async () => {
        try {
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);

          const allMakeupsResponse = await fetch("/api/makeups");
          if (allMakeupsResponse.ok) {
            const allMakeups = await allMakeupsResponse.json();
            const makeupForThisClass = allMakeups.filter(
              (m: { newClassId?: string; newSessionDate: Date; studentId?: string }) => {
                if (m.newClassId?.toString() !== classData._id?.toString()) return false;
                const makeupDate = new Date(m.newSessionDate);
                makeupDate.setHours(0, 0, 0, 0);
                return makeupDate.getTime() === checkDate.getTime();
              }
            );

            if (makeupForThisClass.length > 0) {
              const studentPromises = makeupForThisClass
                .map((req: { studentId?: string }) => {
                  const sid = req.studentId?.toString();
                  if (!sid) return null;
                  return fetch(`/api/students/${sid}`).then((res) => res.json()).catch(() => null);
                })
                .filter((p: Promise<User | null> | null) => p !== null) as Promise<User | null>[];

              const makeupStudentData = await Promise.all(studentPromises);
              setMakeupStudents(makeupStudentData.filter(Boolean) as User[]);
            } else {
              setMakeupStudents([]);
            }
          }
        } catch (error) {
          console.error("Error fetching makeup students:", error);
          setMakeupStudents([]);
        }
      };

      fetchMakeupStudents();
    }
  }, [type, role, classData._id, date, makeupRequests]);

  const studentsForDate = useMemo(() => {
    if (role !== "teacher" || type !== "attendance") return [];
    const merged = [...students, ...makeupStudents];
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
    return out;
  }, [role, type, students, makeupStudents, date, propAttendanceRecords, classData._id]);

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
        return { ...student, competitionScore: profile?.competitionScore || 0 } as User & {
          competitionScore: number;
        };
      })
      .sort((a, b) => (b.competitionScore || 0) - (a.competitionScore || 0))
      .slice(0, 5);

    return withScores;
  }, [studentsForDate, studentProfiles]);

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
    } else if (type === "makeup" && onRequestMakeup) {
      onRequestMakeup(classData._id!.toString(), date, reason);
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
      case "makeup":
        return "Xin học bù";
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

  const handleMarkAttendance = async (studentId: string, status: AttendanceStatus) => {
    if (!user?._id) {
      showError("Không thể xác định giáo viên");
      return;
    }

    setPendingStatusByStudent((prev) => ({ ...prev, [studentId]: status }));
    setSavingAttendance(studentId);

    try {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      const existingAttendance = attendanceRecords.find((att) => {
        if (att.studentId.toString() !== studentId) return false;
        const attDate = new Date(att.sessionDate);
        attDate.setHours(0, 0, 0, 0);
        return attDate.getTime() === checkDate.getTime();
      });

      if (existingAttendance) {
        const response = await fetch(`/api/attendance/${existingAttendance._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error?.error || "Lỗi cập nhật");
        }

        const updated = await response.json();
        setAttendanceRecords((prev) =>
          prev.map((att) =>
            att._id?.toString() === existingAttendance._id?.toString() ? updated : att
          )
        );

        const refreshDateStr = formatDateLocal(checkDate);
        const refreshResponse = await fetch(
          `/api/attendance?classId=${classData._id}&sessionDate=${refreshDateStr}`
        );
        if (refreshResponse.ok) setAttendanceRecords(await refreshResponse.json());

        showSuccess("Đã cập nhật điểm danh");
        flashSaved(studentId);
      } else {
        const attendanceData: CreateAttendanceData = {
          studentId,
          classId: classData._id?.toString(),
          sessionDate: formatDateLocal(checkDate),
          status,
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

        const newAttendance = await response.json();
        setAttendanceRecords((prev) => [...prev, newAttendance]);

        const refreshDateStr = formatDateLocal(checkDate);
        const refreshResponse = await fetch(
          `/api/attendance?classId=${classData._id}&sessionDate=${refreshDateStr}`
        );
        if (refreshResponse.ok) setAttendanceRecords(await refreshResponse.json());

        showSuccess("Đã điểm danh");
        flashSaved(studentId);
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra khi điểm danh";
      showError(errorMessage);
    } finally {
      setSavingAttendance(null);
      setPendingStatusByStudent((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    }
  };

  const palette = [
    { bg: "#F8C9C9", border: "#E8A3A3" },
    { bg: "#F7E49A", border: "#E2C968" },
    { bg: "#BFF0C5", border: "#8FD49B" },
    { bg: "#A9D8FA", border: "#7BBCEB" },
    { bg: "#CFC6FF", border: "#A79BFF" },
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
              ? "pt-1 pb-1 flex-shrink-0"
              : "mb-1 pb-1"
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
                    className="text-gray-600 hover:text-gray-800 transition-colors text-xl"
                    aria-label="Quay lại"
                  >
                    ←
                  </button>
                  <h3 className="text-xl font-bold" style={{ color: colors.darkBrown }}>
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
                <button
                  onClick={() => showSuccess("Tính năng tổng kết sẽ cập nhật sau")}
                  className="ml-auto px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-90 whitespace-nowrap"
                  style={{
                    backgroundColor: "white",
                    color: colors.darkBrown,
                    border: `2px solid ${colors.brown}`,
                  }}
                >
                  Tổng kết
                </button>
              </div>
              {/* Vùng phải header - w-[420px] canh với cột ranking, padding match với body */}
              <div className="w-[420px] flex-shrink-0 flex items-center justify-center p-4">
                <div className="text-lg font-semibold tracking-wide" style={{ color: colors.darkBrown }}>
                  Top xếp hạng lớp
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
                className="text-gray-400 hover:text-gray-600 transition-colors"
                style={{ fontSize: "24px", lineHeight: "1" }}
                aria-label="Đóng"
              >
                ×
              </button>
            </>
          )}
        </div>

        {type === "attendance" && role === "teacher" ? (
          <div className="flex-1 overflow-hidden flex">
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
                      const pending = pendingStatusByStudent[studentId] ?? null;
                      const displayedStatus = pending ?? currentStatus;

                      const isSaving = savingAttendance === studentId;
                      const profile = studentProfiles.get(studentId);
                      const competitionScore = profile?.competitionScore || 0;

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
                          className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all"
                          style={{
                            backgroundColor: tint.bg,
                            borderColor: highlighted ? colors.darkBrown : tint.border,
                            boxShadow: highlighted ? "0 10px 22px rgba(0,0,0,0.10)" : undefined,
                          }}
                        >
                          {/* Avatar + name + small stats */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 relative">
                              {student.avatar ? (
                                <img
                                  src={student.avatar}
                                  alt={student.fullName}
                                  className="w-16 h-16 rounded-full object-cover border-2"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                />
                              ) : (
                                <div
                                  className="w-16 h-16 rounded-full border-2 flex items-center justify-center font-bold"
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
                              <div className="text-[11px] leading-snug" style={{ color: "rgba(108,88,76,0.75)" }}>
                                {(studentRank || "-")}/{studentsForDate.length} • {competitionScore} • 360
                              </div>
                            </div>
                          </div>

                          {/* Middle score */}
                          <div className="flex-shrink-0 text-center px-3">
                            <div className="text-xl font-black" style={{ color: colors.darkBrown }}>
                              {competitionScore}
                            </div>
                          </div>

                          {/* Right actions */}
                          {type === "attendance" && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <input
                                type="text"
                                className="w-10 h-10 rounded-full border-2 text-center text-sm font-semibold"
                                style={{ borderColor: colors.brown, color: colors.darkBrown, backgroundColor: "white" }}
                                aria-label="Input tròn"
                              />
                              <input
                                type="text"
                                className="w-12 h-10 rounded border-2 text-center text-sm font-semibold"
                                style={{ borderColor: colors.brown, color: colors.darkBrown, backgroundColor: "white" }}
                                aria-label="Input chữ nhật"
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

            {/* Right side - Ranking */}
            <div className="w-[420px] flex-shrink-0 p-4 overflow-y-auto" style={{ backgroundColor: "white" }}>
              {classRanking.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border-2" style={{ borderColor: colors.light, color: colors.brown }}>
                  <div className="text-sm">Chưa có dữ liệu xếp hạng</div>
                </div>
              ) : (
                <>
                  {/* Avatar Ranking */}
                  <div className="mb-6">
                    {(() => {
                      const top5 = classRanking.slice(0, 5);
                      
                      // Size cho từng rank
                      const sizeByRank: Record<number, number> = {
                        1: 100, // To nhất
                        2: 75,  // Nhỏ hơn 1, to hơn 4-5
                        3: 75,  // Nhỏ hơn 1, to hơn 4-5
                        4: 60,  // Nhỏ nhất
                        5: 60,  // Nhỏ nhất
                      };

                      const renderAvatar = (rankNumber: number, size: number) => {
                        const student = top5[rankNumber - 1];
                        const id = student?._id?.toString() || "";
                        const color = palette[rankNumber - 1] || palette[4];

                        return (
                          <div
                            key={rankNumber}
                            className="relative cursor-pointer transition-transform hover:scale-105"
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
                          </div>
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

                  {classRanking[0] && (
                    <div
                      className="rounded-2xl border-2 p-3 mb-4 cursor-pointer transition-all hover:opacity-95"
                      style={{ backgroundColor: palette[0].bg, borderColor: palette[0].border }}
                      onMouseEnter={() => {
                        const id = classRanking[0]._id?.toString() || "";
                        if (!id) return;
                        setHighlightStudentId(id);
                        scrollToStudent(id);
                      }}
                      onMouseLeave={() => setHighlightStudentId(null)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-[44px] leading-none font-black" style={{ color: colors.darkBrown }}>
                          1
                        </div>
                        <div className="flex-1 min-w-0 font-semibold truncate" style={{ color: colors.darkBrown }}>
                          {classRanking[0].fullName}
                        </div>
                        <div className="flex-shrink-0 text-sm font-medium" style={{ color: colors.darkBrown }}>
                          {classRanking[0].competitionScore}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {classRanking.slice(1, 5).map((s, idx) => {
                      const rank = idx + 2;
                      const color = palette[rank - 1] || palette[4];
                      const id = s._id?.toString() || "";
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 cursor-pointer transition-all hover:opacity-95"
                          onMouseEnter={() => {
                            if (!id) return;
                            setHighlightStudentId(id);
                            scrollToStudent(id);
                          }}
                          onMouseLeave={() => setHighlightStudentId(null)}
                        >
                          <div className="w-8 text-[42px] leading-none font-black" style={{ color: colors.darkBrown }}>
                            {rank}
                          </div>
                          <div className="flex-1 rounded-2xl border-2 px-4 py-2 flex items-center justify-between" style={{ backgroundColor: color.bg, borderColor: color.border }}>
                            <div className="font-semibold truncate" style={{ color: colors.darkBrown }}>
                              {s.fullName}
                            </div>
                            <div className="flex-shrink-0 text-sm font-medium ml-3" style={{ color: colors.darkBrown }}>
                              {s.competitionScore}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

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

        {type === "makeup" && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.darkBrown }}>
              Lý do xin học bù *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded"
              style={{ borderColor: colors.brown, color: colors.darkBrown }}
              rows={3}
              placeholder="Nhập lý do..."
              required
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t flex-shrink-0" style={{ borderColor: colors.light }}>
          {type === "attendance" && role === "teacher" ? (
            <button
              onClick={requestClose}
              className="mr-2 mb-2 px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md hover:opacity-90"
              style={{ backgroundColor: colors.brown }}
            >
              Đóng
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="mr-2 mb-2 px-5 py-2.5 rounded-lg font-medium text-white transition-all hover:shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.mediumGreen }}
              disabled={(type === "cancel" || type === "absence") && !reason.trim()}
            >
              {type === "cancel" || type === "absence" || type === "makeup" ? "Xác nhận" : "Đóng"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
