"use client";

import { useState } from "react";
import {
  sampleClassSchedules,
  sampleStudents,
  sampleRegistrations,
} from "../data/studentData";

interface StudentSession {
  id: string;
  date: Date;
  timeSlot: string;
  status: string;
  [key: string]: unknown;
}

interface ClassSchedule {
  timeSlot: string;
  dayOfWeek: number;
  [key: string]: unknown;
}

interface DetailedScheduleProps {
  studentSessions: StudentSession[];
  courseStartDate: string;
  courseEndDate: string;
  courseName?: string;
  courseLevel?: string;
  totalSessions?: number;
  completedSessions?: number;
  remainingSessions?: number;
  onRequestMakeup: (sessionId: string, reason: string) => void;
  onBookMakeup: (originalSessionId: string, newSessionId: string) => void;
}

export default function DetailedSchedule({
  studentSessions,
  courseStartDate,
  courseEndDate,
  courseName,
  courseLevel,
  totalSessions,
  completedSessions,
  remainingSessions,
  // onRequestMakeup,
  // onBookMakeup,
}: DetailedScheduleProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMakeupModal, setShowMakeupModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<
    (ClassSchedule & { date?: Date }) | null
  >(null);
  const [makeupReason, setMakeupReason] = useState("");
  const [showMakeupBooking, setShowMakeupBooking] = useState(false);

  // State để theo dõi leave requests và makeup sessions
  const [leaveRequests, setLeaveRequests] = useState<
    Array<{ id: string; [key: string]: unknown }>
  >([]);
  const [makeupSessions, setMakeupSessions] = useState<
    Array<{ id: string; [key: string]: unknown }>
  >([]);
  const [remainingMakeupSessions, setRemainingMakeupSessions] = useState(2); // Số buổi học bù còn lại

  const daysOfWeek = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];

  // Lấy danh sách học sinh trong lớp
  const getStudentsInClass = (classId: string) => {
    const classMapping: { [key: string]: string[] } = {
      "class-monday-morning-1": ["student-1", "student-3", "student-4"],
      "class-monday-morning-2": ["student-5", "student-6"],
      "class-monday-afternoon-1": ["student-7"],
      "class-monday-afternoon-2": ["student-8"],
      "class-monday-evening-1": ["student-1", "student-3", "student-4"],
      "class-monday-evening-2": ["student-5", "student-6"],
      "class-tuesday-morning-1": ["student-2"],
      "class-tuesday-morning-2": ["student-7"],
      "class-tuesday-afternoon-1": ["student-8"],
      "class-tuesday-afternoon-2": ["student-1"],
      "class-tuesday-evening-1": ["student-2", "student-5", "student-6"],
      "class-tuesday-evening-2": ["student-7", "student-8"],
      "class-wednesday-morning-1": ["student-3", "student-4"],
      "class-wednesday-morning-2": ["student-1"],
      "class-wednesday-afternoon-1": ["student-2"],
      "class-wednesday-afternoon-2": ["student-5"],
      "class-wednesday-evening-1": ["student-3", "student-4"],
      "class-wednesday-evening-2": ["student-1", "student-6"],
      "class-thursday-morning-1": ["student-7"],
      "class-thursday-morning-2": ["student-8"],
      "class-thursday-afternoon-1": ["student-2"],
      "class-thursday-afternoon-2": ["student-3"],
      "class-thursday-evening-1": ["student-4", "student-5"],
      "class-thursday-evening-2": ["student-6", "student-7"],
      "class-friday-morning-1": ["student-8"],
      "class-friday-morning-2": ["student-1"],
      "class-friday-afternoon-1": ["student-2"],
      "class-friday-afternoon-2": ["student-3"],
      "class-friday-evening-1": ["student-4"],
      "class-friday-evening-2": ["student-5"],
      "class-saturday-morning-1": ["student-6"],
      "class-saturday-morning-2": ["student-7"],
      "class-saturday-afternoon-1": ["student-8"],
      "class-saturday-afternoon-2": ["student-1"],
      "class-saturday-evening-1": ["student-2"],
      "class-saturday-evening-2": ["student-3"],
      "class-sunday-morning-1": ["student-4"],
      "class-sunday-morning-2": ["student-5"],
      "class-sunday-afternoon-1": ["student-6"],
      "class-sunday-afternoon-2": ["student-7"],
      "class-sunday-evening-1": ["student-8"],
      "class-sunday-evening-2": ["student-1"],
    };

    const studentIds = classMapping[classId] || [];
    return studentIds.map((id) => {
      const student = sampleStudents.find((s) => s.id === id);
      const registration = sampleRegistrations.find((r) => r.studentId === id);
      return {
        id,
        name: student?.fullName || "Unknown",
        phone: student?.phone || "",
        completedSessions: registration?.completedSessions || 0,
      };
    });
  };

  const timeCategories = {
    morning: {
      label: "Sáng",
      slots: ["07:00-08:30", "09:00-10:30"],
      color: "bg-yellow-50 border-yellow-200",
    },
    afternoon: {
      label: "Chiều",
      slots: ["13:00-14:30", "15:00-16:30"],
      color: "bg-orange-50 border-orange-200",
    },
    evening: {
      label: "Tối",
      slots: ["17:30-19:00", "19:30-21:00", "21:30-23:00"],
      color: "bg-blue-50 border-blue-200",
    },
  };

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(startOfWeek);
      newDate.setDate(startOfWeek.getDate() + i);
      dates.push(newDate);
    }
    return dates;
  };

  // const calculateCourseEndDate = (startDate: string, frequency: number) => {
  //   const start = new Date(startDate);
  //   const weeks = frequency === 1 ? 18 : 9; // 18 weeks for 1 session/week, 9 weeks for 2 sessions/week
  //   const end = new Date(start);
  //   end.setDate(start.getDate() + weeks * 7);
  //   return end;
  // };

  const getSlotStatus = (
    classSchedule: ClassSchedule,
    date: Date,
    studentSessions: StudentSession[]
  ) => {
    const now = new Date();

    // Tạo thời gian bắt đầu của buổi học (ngày + giờ)
    const sessionDateTime = new Date(date);
    const [startTime] = classSchedule.timeSlot.split("-");
    const [hours, minutes] = startTime.split(":").map(Number);
    sessionDateTime.setHours(hours, minutes, 0, 0);

    // Tính thời gian có thể xin nghỉ phép (15 phút trước buổi học)
    const canRequestLeaveTime = new Date(sessionDateTime);
    canRequestLeaveTime.setMinutes(canRequestLeaveTime.getMinutes() - 15);

    // Kiểm tra xem buổi học đã qua chưa (dựa trên thời gian bắt đầu + 15 phút)
    const isPast = now > canRequestLeaveTime;

    const isStudentSession = studentSessions.some(
      (session) =>
        session.dayOfWeek === classSchedule.dayOfWeek &&
        session.timeSlot === classSchedule.timeSlot
    );
    const isFull = classSchedule.availableSlots === 0;
    const isInCoursePeriod =
      date >= new Date(courseStartDate) && date <= new Date(courseEndDate);

    // Kiểm tra xem có phải là buổi học bù không
    const isMakeupSession = makeupSessions.some(
      (session) =>
        session.dayOfWeek === classSchedule.dayOfWeek &&
        session.timeSlot === classSchedule.timeSlot &&
        session.date === date.toISOString().split("T")[0]
    );

    // Kiểm tra xem có phải là buổi học vắng có phép không
    const isLeaveRequest = leaveRequests.some(
      (request) =>
        request.dayOfWeek === classSchedule.dayOfWeek &&
        request.timeSlot === classSchedule.timeSlot &&
        request.date === date.toISOString().split("T")[0]
    );

    if (isPast) {
      return {
        status: "past",
        color: "bg-gray-100 text-gray-500",
        label: "",
      };
    }

    // Nếu là buổi học bù
    if (isMakeupSession) {
      return {
        status: "makeup",
        color: "bg-purple-500 text-white",
        label: "",
      };
    }

    // Nếu là buổi học vắng có phép
    if (isLeaveRequest) {
      return {
        status: "leave",
        color: "bg-orange-500 text-white",
        label: "",
      };
    }

    // Nếu là buổi học cố định của học sinh
    if (isStudentSession) {
      return {
        status: "student",
        color: "bg-blue-500 text-white",
        label: "",
      };
    }

    if (isFull) {
      return {
        status: "full",
        color: "bg-red-500 text-white",
        label: "",
      };
    }

    if (!isInCoursePeriod) {
      return {
        status: "inactive",
        color: "bg-gray-200 text-gray-400",
        label: "Ngoài khóa học",
      };
    }

    // Nếu không còn buổi học bù, hiển thị mờ
    const opacity = remainingMakeupSessions > 0 ? "" : "opacity-50";

    return {
      status: "available",
      color: `bg-green-500 text-white ${opacity}`,
      label: "Còn chỗ",
    };
  };

  const handleSlotClick = (classSchedule: ClassSchedule, date: Date) => {
    const slotStatus = getSlotStatus(classSchedule, date, studentSessions);

    if (slotStatus.status === "student") {
      // Right-click to request makeup
      return;
    }

    if (slotStatus.status === "available") {
      // Show makeup booking modal
      setSelectedSession({ ...classSchedule, date });
      setShowMakeupBooking(true);
    }
  };

  const handleRightClick = (
    e: React.MouseEvent,
    classSchedule: ClassSchedule,
    date: Date
  ) => {
    e.preventDefault();
    const slotStatus = getSlotStatus(classSchedule, date, studentSessions);

    if (slotStatus.status === "student") {
      const now = new Date();

      // Tạo thời gian bắt đầu của buổi học (ngày + giờ)
      const sessionDateTime = new Date(date);
      const [startTime] = classSchedule.timeSlot.split("-");
      const [hours, minutes] = startTime.split(":").map(Number);
      sessionDateTime.setHours(hours, minutes, 0, 0);

      // Tính thời gian có thể xin nghỉ phép (15 phút trước buổi học)
      const canRequestLeaveTime = new Date(sessionDateTime);
      canRequestLeaveTime.setMinutes(canRequestLeaveTime.getMinutes() - 15);

      if (now <= canRequestLeaveTime) {
        // Có thể xin nghỉ phép (ít nhất 15 phút trước buổi học)
        setSelectedSession({ ...classSchedule, date });
        setShowMakeupModal(true);
      } else {
        alert("Bạn chỉ có thể xin nghỉ phép trước buổi học ít nhất 15 phút!");
      }
    }
  };

  // Xử lý xin nghỉ phép
  const handleRequestLeave = () => {
    if (!selectedSession || !selectedSession.date || !makeupReason.trim()) {
      alert("Vui lòng nhập lý do xin nghỉ!");
      return;
    }

    const leaveRequest = {
      id: `leave-${Date.now()}`,
      dayOfWeek: selectedSession.dayOfWeek,
      timeSlot: selectedSession.timeSlot,
      date: selectedSession.date.toISOString().split("T")[0],
      reason: makeupReason,
      status: "approved", // Mock: tự động approve
      createdAt: new Date().toISOString(),
    };

    setLeaveRequests((prev) => [...prev, leaveRequest]);
    setRemainingMakeupSessions((prev) => prev + 1); // Tăng số buổi học bù
    setShowMakeupModal(false);
    setMakeupReason("");
    setSelectedSession(null);

    alert("Đã xin nghỉ phép thành công! Bạn có thêm 1 buổi học bù.");
  };

  // Xử lý đăng ký học bù
  const handleBookMakeupSession = () => {
    if (!selectedSession || !selectedSession.date) return;

    const makeupSession = {
      id: `makeup-${Date.now()}`,
      dayOfWeek: selectedSession.dayOfWeek,
      timeSlot: selectedSession.timeSlot,
      date: selectedSession.date.toISOString().split("T")[0],
      room: selectedSession.room,
      createdAt: new Date().toISOString(),
    };

    setMakeupSessions((prev) => [...prev, makeupSession]);
    setRemainingMakeupSessions((prev) => Math.max(0, prev - 1)); // Giảm số buổi học bù
    setShowMakeupBooking(false);
    setSelectedSession(null);

    alert("Đã đăng ký học bù thành công!");
  };

  const weekDates = getWeekDates(selectedDate);

  return (
    <div className="space-y-6">
      {/* Course Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
        <div className="space-y-6">
          {/* Thông tin khóa học */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#2c3e50] mb-3">
              {courseName || "Thông tin khóa học"}
            </h2>
            <div className="flex flex-wrap justify-center gap-6 text-lg text-[#654321] mb-4">
              <span className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Bắt đầu: {new Date(courseStartDate).toLocaleDateString("vi-VN")}
              </span>
              <span className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Kết thúc: {new Date(courseEndDate).toLocaleDateString("vi-VN")}
              </span>
            </div>

            {courseLevel && (
              <div className="flex justify-center">
                <span className="bg-[#D4A047] text-white px-4 py-2 rounded-full text-base font-medium">
                  Level:{" "}
                  {courseLevel === "basic"
                    ? "Cơ bản"
                    : courseLevel === "intermediate"
                    ? "Trung cấp"
                    : "Nâng cao"}
                </span>
              </div>
            )}
          </div>

          {/* Thống kê tiến độ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <div className="text-sm text-gray-600 mb-2">Tổng thời gian</div>
              <div className="text-2xl font-bold text-[#2c3e50]">
                {Math.ceil(
                  (new Date(courseEndDate).getTime() -
                    new Date(courseStartDate).getTime()) /
                    (1000 * 60 * 60 * 24 * 7)
                )}{" "}
                tuần
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <div className="text-sm text-gray-600 mb-2">Buổi học</div>
              <div className="text-2xl font-bold text-[#2c3e50]">
                {completedSessions || 0}/{totalSessions || 0}
              </div>
              {remainingSessions !== undefined && (
                <div className="text-sm text-gray-500 mt-1">
                  còn {remainingSessions} buổi
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg p-6 border border-purple-200 text-center">
              <div className="text-sm text-purple-700 mb-2">
                Buổi học bù còn lại
              </div>
              <div className="text-3xl font-bold text-purple-800">
                {remainingMakeupSessions}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2c3e50]">Lịch học chi tiết</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(selectedDate.getDate() - 7);
              setSelectedDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
          <span className="text-lg font-medium text-[#2c3e50]">
            Tuần {Math.ceil(selectedDate.getDate() / 7)}
          </span>
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(selectedDate.getDate() + 7);
              setSelectedDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="grid grid-cols-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="p-6 font-bold text-[#2c3e50] text-lg flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Giờ học
          </div>
          {weekDates.map((date, index) => (
            <div
              key={index}
              className="p-6 text-center border-l border-gray-200 hover:bg-blue-100 transition-colors"
            >
              <div className="text-sm font-semibold text-[#654321] mb-1">
                {daysOfWeek[date.getDay()]}
              </div>
              <div className="text-2xl font-bold text-[#2c3e50]">
                {date.getDate()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {date.toLocaleDateString("vi-VN", { month: "short" })}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        {Object.entries(timeCategories).map(([category, config]) => (
          <div
            key={category}
            className="border-b border-gray-100 last:border-b-0"
          >
            <div
              className={`p-4 font-bold text-[#2c3e50] text-lg ${config.color} flex items-center`}
            >
              <div className="w-3 h-3 rounded-full bg-current mr-3"></div>
              {config.label}
            </div>
            {config.slots.map((timeSlot) => (
              <div
                key={timeSlot}
                className="grid grid-cols-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="p-4 font-semibold text-[#654321] border-r border-gray-200 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#D4A047] mr-3"></div>
                  {timeSlot}
                </div>
                {weekDates.map((date, dayIndex) => {
                  const classSchedule = sampleClassSchedules.find(
                    (schedule) =>
                      schedule.dayOfWeek === date.getDay() &&
                      schedule.timeSlot === timeSlot
                  );

                  if (!classSchedule) {
                    return (
                      <div
                        key={dayIndex}
                        className="p-4 border-l border-gray-200 bg-gray-50/50 flex items-center justify-center rounded-xl m-1"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </div>
                      </div>
                    );
                  }

                  const slotStatus = getSlotStatus(
                    classSchedule as unknown as ClassSchedule,
                    date,
                    studentSessions
                  );

                  return (
                    <div
                      key={dayIndex}
                      className={`p-4 border-l border-gray-200 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md ${slotStatus.color} rounded-xl m-1 relative`}
                      onClick={() =>
                        handleSlotClick(
                          classSchedule as unknown as ClassSchedule,
                          date
                        )
                      }
                      onContextMenu={(e) =>
                        handleRightClick(
                          e,
                          classSchedule as unknown as ClassSchedule,
                          date
                        )
                      }
                      title={`${slotStatus.label} - ${classSchedule.room}`}
                    >
                      {/* Số chỗ còn lại ở góc trên-phải */}
                      <div className="absolute top-1 right-1 w-6 h-6 bg-white/90 text-black text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                        {classSchedule.availableSlots}
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <div className="text-sm font-bold mb-1">
                          {classSchedule.courseType === "online"
                            ? "Lớp online"
                            : "Lớp offline"}
                        </div>
                        <div className="text-xs opacity-90">
                          {classSchedule.room}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span>Lớp của bạn</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span>Còn chỗ</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span>Đã đầy</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
          <span>Học bù</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
          <span>Vắng có phép</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
          <span>Quá khứ</span>
        </div>
      </div>

      {/* Makeup Request Modal */}
      {showMakeupModal && selectedSession && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-[#2c3e50] mb-4">
              Xin nghỉ phép
            </h3>
            <div className="mb-4">
              <div className="text-sm text-[#654321] mb-2">
                Buổi học:{" "}
                {(selectedSession.className as string) || "Lớp Guitar Cơ Bản"}
              </div>
              <div className="text-sm text-[#654321] mb-4">
                Thời gian: {selectedSession.timeSlot}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                Lý do xin nghỉ phép
              </label>
              <textarea
                value={makeupReason}
                onChange={(e) => setMakeupReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#D4A047] focus:border-[#D4A047]"
                rows={3}
                placeholder="Nhập lý do xin nghỉ phép..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMakeupModal(false);
                  setMakeupReason("");
                  setSelectedSession(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleRequestLeave}
                className="px-4 py-2 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Makeup Booking Modal */}
      {showMakeupBooking && selectedSession && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-[#2c3e50] mb-4">
              Đăng ký học bù
            </h3>
            <div className="mb-4">
              <div className="text-sm text-[#654321] mb-2">
                Lớp học bù: {selectedSession.room as string}
              </div>
              <div className="text-sm text-[#654321] mb-4">
                Thời gian: {selectedSession.timeSlot as string}
              </div>
            </div>

            {/* Danh sách học sinh trong lớp */}
            <div className="mb-6">
              <div className="text-sm font-medium text-[#2c3e50] mb-3">
                Bạn sẽ học cùng với:
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {getStudentsInClass(selectedSession.id as string).map(
                  (student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border"
                    >
                      <div>
                        <span className="font-medium">{student.name}</span>
                        <span className="text-gray-500 ml-2">
                          ({student.phone})
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Đã học: {student.completedSessions}/12 buổi
                      </div>
                    </div>
                  )
                )}
                {getStudentsInClass(selectedSession.id as string).length ===
                  0 && (
                  <div className="text-center text-gray-500 text-xs py-2">
                    Chưa có học viên nào trong lớp này
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-[#654321]">
                Bạn có chắc chắn muốn đăng ký học bù vào lớp này không?
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMakeupBooking(false);
                  setSelectedSession(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleBookMakeupSession}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
