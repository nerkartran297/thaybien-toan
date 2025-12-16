import { useMemo, useState } from "react";

// Temporary interfaces - replace with actual models if needed
interface IClassCancellation {
  classId: string;
  date: string;
  reason: string;
}

interface IClassSchedule {
  id?: string;
  _id?: string;
  className: string;
  date: string;
  time: string;
  dayOfWeek?: number;
  timeSlot?: string;
  timeCategory?: string;
  currentEnrollment?: number;
  maxCapacity?: number;
  courseType?: string;
  courseId?: unknown;
  room?: string;
}

interface PopulatedStudentCourse {
  id: string;
  studentId: string;
  courseId: string;
  schedule?: {
    sessions: Array<{
      classId?: { toString(): string } | string;
      startDate?: string | Date;
      [key: string]: unknown;
    }>;
  };
  [key: string]: unknown;
}

interface TeacherScheduleProps {
  classSchedules: IClassSchedule[];
  studentCourses: PopulatedStudentCourse[];
  onCancelClass: (classId: string, date: string, reason: string) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  cancellations: IClassCancellation[];
}

const timeCategories = {
  morning: {
    label: "Sáng",
    color: "bg-yellow-500",
    bgColor: "bg-gradient-to-r from-yellow-50 to-orange-50",
    borderColor: "border-yellow-200",
    slots: ["7:00-8:30", "9:00-10:30"],
  },
  afternoon: {
    label: "Chiều",
    color: "bg-blue-500",
    bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
    borderColor: "border-blue-200",
    slots: ["13:00-14:30", "15:00-16:30"],
  },
  evening: {
    label: "Tối",
    color: "bg-purple-500",
    bgColor: "bg-gradient-to-r from-purple-50 to-pink-50",
    borderColor: "border-purple-200",
    slots: ["17:30-19:00", "19:30-21:00", "21:30-23:00"],
  },
};

export default function TeacherSchedule({
  classSchedules,
  studentCourses,
  onCancelClass,
  currentDate,
  setCurrentDate,
  cancellations,
}: TeacherScheduleProps) {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const daysOfWeek = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  const getClassesForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    return classSchedules.filter((cls) => cls.dayOfWeek === dayOfWeek);
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isClassPast = (classInfo: IClassSchedule, date: Date) => {
    const now = new Date();
    const classDate = new Date(date);

    const timeSlot = classInfo.timeSlot;
    if (!timeSlot) return false;
    const [startTime] = timeSlot.split("-");
    const [hours, minutes] = startTime.split(":").map(Number);

    classDate.setHours(hours, minutes, 0, 0);

    return now > classDate;
  };

  const isClassCancelled = (
    classId: string,
    date: Date
  ): IClassCancellation | undefined => {
    // Chuẩn hóa ngày về YYYY-MM-DD để so sánh
    const dateString = date.toISOString().split("T")[0];

    return cancellations.find((c) => {
      // So sánh Class ID
      const isSameClass = c.classId.toString() === classId.toString();
      // So sánh ngày (chỉ quan tâm YYYY-MM-DD)
      const isSameDate =
        new Date(c.date).toISOString().split("T")[0] === dateString;

      return isSameClass && isSameDate;
    });
  };

  const handleCancelClass = async () => {
    if (!selectedClass || !selectedDate || !cancellationReason.trim()) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (isCancelling) return; // tránh bấm nhiều lần

    setIsCancelling(true);

    const classInfo = classSchedules.find(
      (cls) => cls._id?.toString() === selectedClass
    );
    if (!classInfo) {
      setIsCancelling(false);
      return;
    }

    const cancelDate = new Date(selectedDate);
    if (isClassPast(classInfo, cancelDate)) {
      alert("Không thể hủy lớp học đã qua!");
      setIsCancelling(false);
      return;
    }

    try {
      await onCancelClass(selectedClass, selectedDate, cancellationReason);
    } catch (error) {
      console.error("Failed to cancel class", error);
      alert("Đã có lỗi xảy ra khi hủy lớp!");
    } finally {
      setIsCancelling(false);
    }

    setSelectedClass("");
    setSelectedDate("");
    setCancellationReason("");
    setShowCancellationModal(false);
  };

  const classStartDateMap = useMemo(() => {
    const map = new Map<string, Date>(); // <classId, earliestStartDate>

    for (const sc of studentCourses) {
      if (!sc.schedule) continue;
      for (const session of sc.schedule.sessions) {
        if (!session.classId || !session.startDate) continue;
        const classId =
          typeof session.classId === "string"
            ? session.classId
            : session.classId.toString();
        const startDate = new Date(session.startDate);

        if (!map.has(classId) || startDate < map.get(classId)!) {
          map.set(classId, startDate);
        }
      }
    }
    return map;
  }, [studentCourses]);

  const getSessionNumberDisplay = (
    classId: string,
    calendarDate: Date,
    totalSessions: number
  ): string => {
    const earliestStartDate = classStartDateMap.get(classId.toString());

    if (!earliestStartDate) {
      return "Chưa xếp"; // Không có học viên nào
    }

    const calDate = new Date(calendarDate);
    calDate.setHours(0, 0, 0, 0);
    const startDate = new Date(earliestStartDate);
    startDate.setHours(0, 0, 0, 0);

    const timeDiff = calDate.getTime() - startDate.getTime();
    if (timeDiff < 0) return "Sắp học";

    // --- Tính số tuần đã trôi qua ---
    let weekNumber = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7)) + 1;

    // --- Giảm số tuần nếu có các buổi bị hủy trước ngày này ---
    const cancelledBefore = cancellations.filter(
      (c) => c.classId.toString() === classId && new Date(c.date) < calDate
    ).length;

    weekNumber -= cancelledBefore;

    if (weekNumber > totalSessions) return "Đã kết thúc";
    if (weekNumber <= 0) return "Sắp học";

    return `${weekNumber}/${totalSessions}`;
  };

  const formatDateString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const weekDates = getWeekDates(currentDate);

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Lịch học tuần</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(currentDate.getDate() - 7);
              setCurrentDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Tuần trước"
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
          <span className="text-lg font-medium text-gray-900">
            {(() => {
              const today = new Date();
              const startOfCurrentWeek = new Date(today);
              startOfCurrentWeek.setDate(today.getDate() - today.getDay());
              startOfCurrentWeek.setHours(0, 0, 0, 0);

              const startOfSelectedWeek = new Date(currentDate);
              startOfSelectedWeek.setDate(
                currentDate.getDate() - currentDate.getDay()
              );
              startOfSelectedWeek.setHours(0, 0, 0, 0);

              const diffInWeeks = Math.round(
                (startOfSelectedWeek.getTime() - startOfCurrentWeek.getTime()) /
                  (7 * 24 * 60 * 60 * 1000)
              );

              if (diffInWeeks === 0) {
                return "Tuần này";
              } else if (diffInWeeks < 0) {
                return `Tuần trước ${Math.abs(diffInWeeks)}`;
              } else {
                return `Tuần sau +${diffInWeeks}`;
              }
            })()}
          </span>
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(currentDate.getDate() + 7);
              setCurrentDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Tuần sau"
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
          <div className="p-4 font-bold text-[#2c3e50] text-lg flex items-center">
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
        {Object.entries(timeCategories).map(([category, config]) => {
          const actualTimeSlots = classSchedules
            .filter((cls) => cls.timeCategory === category)
            .map((cls) => cls.timeSlot)
            .filter((slot, index, arr) => arr.indexOf(slot) === index) // Remove duplicates
            .sort();

          return (
            <div
              key={category}
              className="border-b border-gray-100 last:border-b-0"
            >
              <div className="grid grid-cols-8">
                {/* Time Slots Column */}
                <div
                  className={`${config.bgColor} p-4 border-r border-gray-200`}
                >
                  <div className="text-sm text-gray-600 space-y-1">
                    {actualTimeSlots.length > 0
                      ? actualTimeSlots.map((slot, index) => (
                          <div
                            key={index}
                            className="font-medium h-16 flex items-center justify-center text-center"
                          >
                            {slot}
                          </div>
                        ))
                      : config.slots.map((slot, index) => (
                          <div
                            key={index}
                            className="font-medium h-16 flex items-center justify-center text-center"
                          >
                            {slot}
                          </div>
                        ))}
                  </div>
                </div>

                {/* Days */}
                {weekDates.map((date, dayIndex) => {
                  const classesForDate = getClassesForDate(date).filter(
                    (cls) => {
                      if (!cls._id) return false;
                      const earliestStartDate = classStartDateMap.get(
                        cls._id.toString()
                      );
                      if (!earliestStartDate) return false; // ẩn lớp chưa có học sinh
                      // Chuẩn hóa ngày để so sánh chỉ ngày, không so giờ
                      const todayDate = new Date(date);
                      todayDate.setHours(0, 0, 0, 0);

                      const startDate = new Date(earliestStartDate);
                      startDate.setHours(0, 0, 0, 0);

                      return startDate <= todayDate; // chỉ hiển thị lớp bắt đầu trước hoặc đúng hôm nay
                    }
                  );
                  const classesInThisCategory = classesForDate.filter(
                    (cls) => cls.timeCategory === category
                  );

                  const sortedClasses = classesInThisCategory.sort((a, b) => {
                    const timeA = a.timeSlot?.split("-")[0] || "";
                    const timeB = b.timeSlot?.split("-")[0] || "";
                    return timeA.localeCompare(timeB);
                  });

                  return (
                    <div
                      key={dayIndex}
                      className="p-4 border-r border-gray-200 last:border-r-0"
                    >
                      <div className="space-y-1">
                        {actualTimeSlots.length > 0
                          ? actualTimeSlots.map((timeSlot, slotIndex) => {
                              const classForThisSlot = sortedClasses.find(
                                (cls) => cls.timeSlot === timeSlot
                              );

                              if (classForThisSlot) {
                                const isFull =
                                  (classForThisSlot.currentEnrollment ?? 0) >=
                                  (classForThisSlot.maxCapacity ?? 0);
                                const isPastClass = isClassPast(
                                  classForThisSlot,
                                  date
                                );

                                // --- 5. KIỂM TRA HỦY LỚP ---
                                const cancellationInfo = isClassCancelled(
                                  classForThisSlot._id?.toString() || "",
                                  date
                                );
                                // ---------------------------

                                return (
                                  <div
                                    key={`${dayIndex}-${slotIndex}`}
                                    // --- 6. CẬP NHẬT STYLING ---
                                    className={`group relative h-16 p-3 rounded-xl text-sm hover:scale-105 transition-transform flex flex-col justify-center ${
                                      isPastClass
                                        ? "bg-gray-100 text-gray-500" // 1. Đã qua
                                        : cancellationInfo
                                        ? "bg-gray-300 text-gray-700 line-through decoration-gray-900" // 2. Đã hủy
                                        : isFull
                                        ? "bg-red-500 text-white" // 3. Đã đầy
                                        : "bg-green-500 text-white" // 4. Còn trống
                                    }`}
                                  >
                                    {/* --- 7. CẬP NHẬT LOGIC NÚT HỦY --- */}
                                    {/* Chỉ hiển thị nút khi CHƯA qua VÀ CHƯA bị hủy */}
                                    {!isPastClass && !cancellationInfo && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (classForThisSlot._id) {
                                            setSelectedClass(
                                              classForThisSlot._id.toString()
                                            );
                                            setSelectedDate(
                                              date.toISOString().split("T")[0]
                                            );
                                          }
                                          setShowCancellationModal(true);
                                        }}
                                        className="absolute -top-1 -left-1 w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
                                        title="Hủy lớp"
                                      >
                                        ×
                                      </button>
                                    )}

                                    {/* --- 8. CẬP NHẬT NỘI DUNG THẺ --- */}
                                    {cancellationInfo ? (
                                      <div className="text-xs font-semibold text-center">
                                        <p>ĐÃ HỦY</p>
                                        <p className="italic font-medium truncate">
                                          ({cancellationInfo.reason})
                                        </p>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="text-xs opacity-90 mb-1">
                                          {classForThisSlot.courseType ===
                                          "online"
                                            ? "Lớp online"
                                            : "Lớp offline"}
                                        </div>
                                        <div className="text-xs font-medium">
                                          {classForThisSlot.currentEnrollment ??
                                            0}
                                          /{classForThisSlot.maxCapacity ?? 0}{" "}
                                          học viên
                                        </div>
                                        <div className="absolute top-1 right-1 w-auto h-6 px-2 bg-white/90 text-black text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                                          {getSessionNumberDisplay(
                                            classForThisSlot._id?.toString() ||
                                              "",
                                            date,
                                            (classForThisSlot.courseId &&
                                            typeof classForThisSlot.courseId ===
                                              "object" &&
                                            "totalSessions" in
                                              classForThisSlot.courseId
                                              ? (
                                                  classForThisSlot.courseId as {
                                                    totalSessions?: number;
                                                  }
                                                ).totalSessions
                                              : undefined) || 12
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              } else {
                                return (
                                  <div
                                    key={`${dayIndex}-${slotIndex}`}
                                    className="h-16 p-3 rounded-xl text-sm text-gray-400 text-center flex items-center justify-center"
                                  >
                                    {isPast(date) ? "Đã qua" : ""}
                                  </div>
                                );
                              }
                            })
                          : config.slots.map((timeSlot, slotIndex) => (
                              <div
                                key={`${dayIndex}-${slotIndex}`}
                                className="h-16 p-3 rounded-xl text-sm text-gray-400 text-center flex items-center justify-center"
                              >
                                {isPast(date) ? "Đã qua" : ""}
                              </div>
                            ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showCancellationModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-6xl w-full mx-4 flex gap-8">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#2c3e50]">
                  Xác nhận hủy lớp học
                </h3>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>

              {selectedClass && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-[#2c3e50] mb-4">
                    Thông tin lớp học
                  </h4>
                  {(() => {
                    const classInfo = classSchedules.find(
                      (cls) => cls._id?.toString() === selectedClass
                    );
                    if (!classInfo) return null;

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Phòng:</strong> {classInfo.room}
                          </div>
                          <div>
                            <strong>Ngày hủy:</strong>{" "}
                            {formatDateString(selectedDate)}
                          </div>
                          <div>
                            <strong>Thời gian:</strong>{" "}
                            {classInfo.dayOfWeek !== undefined
                              ? daysOfWeek[classInfo.dayOfWeek]
                              : ""}{" "}
                            {classInfo.timeSlot}
                          </div>
                          <div>
                            <strong>Học viên:</strong>{" "}
                            {classInfo.currentEnrollment ?? 0}/
                            {classInfo.maxCapacity ?? 0}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                          {(() => {
                            const cancelDate = new Date(selectedDate);
                            if (!classInfo.timeSlot) return null;
                            const classTime = classInfo.timeSlot.split("-")[0];
                            const [hours, minutes] = classTime
                              .split(":")
                              .map(Number);
                            cancelDate.setHours(hours, minutes, 0, 0);
                            const now = new Date();
                            const timeDiff =
                              cancelDate.getTime() - now.getTime();
                            const hoursDiff = Math.floor(
                              timeDiff / (1000 * 60 * 60)
                            );
                            const minutesDiff = Math.floor(
                              (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
                            );

                            if (timeDiff < 0) {
                              return "⚠️ Lớp học đã qua";
                            } else if (timeDiff < 15 * 60 * 1000) {
                              return `⚠️ Lớp học bắt đầu trong ${minutesDiff} phút`;
                            } else {
                              return `⏰ Lớp học bắt đầu trong ${hoursDiff}h ${minutesDiff}m`;
                            }
                          })()}
                        </div>

                        <div className="text-red-600 font-medium bg-red-50 p-3 rounded border border-red-200">
                          ⚠️ Sẽ tạo {classInfo.currentEnrollment ?? 0} buổi học
                          bù cho học viên
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do hủy lớp
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Ví dụ: Bận việc đột xuất, ốm..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCancellationModal(false);
                    setSelectedClass("");
                    setSelectedDate("");
                    setCancellationReason("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCancelClass}
                  disabled={isCancelling}
                  className={`px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                    isCancelling ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>
                    {isCancelling ? "Đang hủy..." : "Xác nhận hủy lớp"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-6 h-full">
                <h4 className="font-semibold text-[#2c3e50] mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  Danh sách học viên
                  {selectedClass &&
                    (() => {
                      const classInfo = classSchedules.find(
                        (cls) => cls._id?.toString() === selectedClass
                      );
                      return classInfo
                        ? ` (${classInfo.currentEnrollment ?? 0} người)`
                        : "";
                    })()}
                </h4>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedClass &&
                    (() => {
                      const enrolledStudents = studentCourses.filter((sc) =>
                        sc.schedule?.sessions.some((session) => {
                          if (!session.classId) return false;
                          const classId =
                            typeof session.classId === "string"
                              ? session.classId
                              : session.classId.toString();
                          return classId === selectedClass;
                        })
                      );

                      if (enrolledStudents.length === 0) {
                        return (
                          <div className="text-gray-500 text-center py-8">
                            <svg
                              className="w-12 h-12 mx-auto mb-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                              />
                            </svg>
                            <p>Chưa có học viên đăng ký</p>
                          </div>
                        );
                      }

                      return enrolledStudents.map((studentCourse) => {
                        const student = studentCourse.studentId;
                        const studentId =
                          typeof student === "string"
                            ? student
                            : (
                                student as { _id?: { toString(): string } }
                              )._id?.toString() || "";
                        return (
                          <div
                            key={studentId}
                            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-lg">
                                  {(
                                    (student as { fullName?: string })
                                      .fullName || ""
                                  ).charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-lg">
                                  {(student as { fullName?: string })
                                    .fullName || ""}
                                </div>
                                <div className="text-gray-600 text-sm">
                                  📞{" "}
                                  {(student as { phoneNumber?: string })
                                    .phoneNumber || ""}
                                </div>
                                <div className="text-gray-500 text-sm">
                                  ✉️{" "}
                                  {(student as { email?: string }).email || ""}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                                  {(
                                    studentCourse as {
                                      courseId?: { level?: string };
                                    }
                                  ).courseId?.level === "basic" && "Cơ bản"}
                                  {(
                                    studentCourse as {
                                      courseId?: { level?: string };
                                    }
                                  ).courseId?.level === "intermediate" &&
                                    "Trung cấp"}
                                  {(
                                    studentCourse as {
                                      courseId?: { level?: string };
                                    }
                                  ).courseId?.level === "advanced" &&
                                    "Nâng cao"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
