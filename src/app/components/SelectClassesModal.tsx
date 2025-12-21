"use client";

import { useState } from "react";
// import { useEffect } from "react";
import { Class } from "@/models/Class";
import { StudentEnrollment } from "@/models/StudentEnrollment";

interface SelectClassesModalProps {
  enrollment: StudentEnrollment;
  classes: Class[];
  onClose: () => void;
  onSelect: (classIds: string[]) => Promise<void>;
}

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

export default function SelectClassesModal({
  enrollment,
  classes,
  onClose,
  onSelect,
}: SelectClassesModalProps) {
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter classes by active status
  const availableClasses = classes.filter((cls) => cls.isActive);

  // Group classes (no longer using seriesId)
  const classGroups = new Map<string, Class[]>();
  const singleClasses: Class[] = [];

  availableClasses.forEach((cls) => {
    // Group by class name or _id since seriesId no longer exists
    const groupKey = cls._id?.toString() || cls.name;
    if (!classGroups.has(groupKey)) {
      classGroups.set(groupKey, []);
    }
    classGroups.get(groupKey)!.push(cls);
  });

  // Get all class IDs in a series
  const getSeriesClassIds = (classId: string): string[] => {
    // Since seriesId no longer exists, each class is treated as a single class
    return [classId];
  };

  // Count unique classes from selected class IDs
  const countSelectedSeries = (classIds: string[]): number => {
    // Since seriesId no longer exists, just return the count of selected classes
    return classIds.length;
  };

  const handleToggleClass = (classId: string) => {
    setSelectedClasses((prev) => {
      // Get all class IDs in the series (if it's a repeating class)
      const seriesClassIds = getSeriesClassIds(classId);

      // Check if any class in the series is already selected
      const isSeriesSelected = seriesClassIds.some((id) => prev.includes(id));

      if (isSeriesSelected) {
        // Remove all classes in the series
        return prev.filter((id) => !seriesClassIds.includes(id));
      } else {
        // Check how many series are currently selected
        const currentSeriesCount = countSelectedSeries(prev);

        // Add all classes in the series if we haven't reached the frequency limit
        if (currentSeriesCount < enrollment.frequency) {
          return [...prev, ...seriesClassIds];
        } else {
          alert(`Bạn chỉ có thể chọn tối đa ${enrollment.frequency} buổi học`);
          return prev;
        }
      }
    });
  };

  const handleSubmit = async () => {
    const selectedCount = countSelectedSeries(selectedClasses);
    if (selectedCount !== enrollment.frequency) {
      alert(`Vui lòng chọn đúng ${enrollment.frequency} buổi học`);
      return;
    }

    setLoading(true);
    try {
      await onSelect(selectedClasses);
    } catch (error) {
      console.error("Error selecting classes:", error);
      alert("Có lỗi xảy ra khi chọn lớp học");
    } finally {
      setLoading(false);
    }
  };

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
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ borderColor: colors.brown, borderWidth: "2px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-2xl font-bold mb-4"
          style={{ color: colors.darkBrown }}
        >
          Chọn Lớp Học Cố Định
        </h3>

        <p className="mb-4 text-sm" style={{ color: colors.brown }}>
          Vui lòng chọn {enrollment.frequency} buổi học cố định trong tuần. Bạn
          có thể hủy và học bù sau này.
        </p>

        {availableClasses.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: colors.brown }}>
              Không có lớp học nào khả dụng cho khóa học này.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded text-white"
              style={{ backgroundColor: colors.brown }}
            >
              Đóng
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {/* Show grouped repeating classes */}
              {Array.from(classGroups.entries()).map(
                ([groupKey, seriesClasses]) => {
                  const firstClass = seriesClasses[0];
                  const isSelected = selectedClasses.some((id) =>
                    seriesClasses.some((c) => c._id?.toString() === id)
                  );
                  const firstSession =
                    firstClass.sessions && firstClass.sessions.length > 0
                      ? firstClass.sessions[0]
                      : null;
                  const dayName = firstSession
                    ? dayNames[firstSession.dayOfWeek]
                    : "";
                  const timeStr = firstSession?.startTime || "";
                  const endTimeStr = firstSession?.endTime || "";
                  // Remove maxStudents check since it no longer exists
                  const isFull = false;

                  return (
                    <div
                      key={groupKey}
                      onClick={() =>
                        !isFull && handleToggleClass(firstClass._id!.toString())
                      }
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : isFull
                          ? "border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed"
                          : "border-gray-300 hover:border-green-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div
                            className="font-semibold"
                            style={{ color: colors.darkBrown }}
                          >
                            {firstClass.name.replace(
                              / - \d{1,2}\/\d{1,2}\/\d{4}$/,
                              ""
                            )}{" "}
                            (Lớp lặp lại)
                          </div>
                          <div
                            className="text-sm mt-1"
                            style={{ color: colors.brown }}
                          >
                            {dayName && `${dayName} `}
                            {timeStr && `${timeStr} - ${endTimeStr}`}
                          </div>
                          <div
                            className="text-xs mt-1"
                            style={{ color: colors.brown }}
                          >
                            {seriesClasses.length} buổi học
                          </div>
                        </div>
                        <div className="ml-4">
                          {isSelected && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: colors.mediumGreen }}
                            >
                              <span className="text-white text-sm">✓</span>
                            </div>
                          )}
                          {!isSelected && !isFull && (
                            <div
                              className="w-6 h-6 rounded-full border-2"
                              style={{ borderColor: colors.brown }}
                            />
                          )}
                          {isFull && (
                            <span
                              className="text-xs"
                              style={{ color: colors.brown }}
                            >
                              Đầy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              {/* Show single classes */}
              {singleClasses.map((cls) => {
                const firstSession =
                  cls.sessions && cls.sessions.length > 0
                    ? cls.sessions[0]
                    : null;
                const dayName = firstSession
                  ? dayNames[firstSession.dayOfWeek]
                  : "";
                const timeStr = firstSession?.startTime || "";
                const endTimeStr = firstSession?.endTime || "";
                const isSelected = selectedClasses.includes(
                  cls._id!.toString()
                );
                // Remove maxStudents check since it no longer exists
                const isFull = false;

                return (
                  <div
                    key={cls._id?.toString()}
                    onClick={() =>
                      !isFull && handleToggleClass(cls._id!.toString())
                    }
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : isFull
                        ? "border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed"
                        : "border-gray-300 hover:border-green-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div
                          className="font-semibold"
                          style={{ color: colors.darkBrown }}
                        >
                          {cls.name}
                        </div>
                        <div
                          className="text-sm mt-1"
                          style={{ color: colors.brown }}
                        >
                          {dayName && `${dayName} `}
                          {timeStr && `${timeStr} - ${endTimeStr}`}
                        </div>
                        <div
                          className="text-xs mt-1"
                          style={{ color: colors.brown }}
                        >
                          {cls.enrolledStudents.length} học viên
                        </div>
                      </div>
                      <div className="ml-4">
                        {isSelected && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: colors.mediumGreen }}
                          >
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                        {!isSelected && !isFull && (
                          <div
                            className="w-6 h-6 rounded-full border-2"
                            style={{ borderColor: colors.brown }}
                          />
                        )}
                        {isFull && (
                          <span
                            className="text-xs"
                            style={{ color: colors.brown }}
                          >
                            Đầy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm" style={{ color: colors.brown }}>
                Đã chọn: {countSelectedSeries(selectedClasses)}/
                {enrollment.frequency} buổi
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded transition-colors"
                  style={{
                    backgroundColor: colors.light,
                    color: colors.darkBrown,
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    countSelectedSeries(selectedClasses) !==
                      enrollment.frequency
                  }
                  className="px-4 py-2 rounded text-white transition-colors"
                  style={{
                    backgroundColor:
                      countSelectedSeries(selectedClasses) ===
                      enrollment.frequency
                        ? colors.mediumGreen
                        : colors.brown,
                    opacity:
                      countSelectedSeries(selectedClasses) ===
                      enrollment.frequency
                        ? 1
                        : 0.5,
                  }}
                >
                  {loading ? "Đang lưu..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
