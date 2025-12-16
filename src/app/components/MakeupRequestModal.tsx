"use client";

import React, { useState } from "react";
import { Class } from "@/models/Class";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

interface MakeupRequestModalProps {
  originalClass: Class;
  originalDate: Date;
  availableClasses: Class[];
  currentWeekStart: Date; // Start of the current week being viewed in calendar
  onClose: () => void;
  onSubmit: (newClassId: string, newDate: Date, reason: string) => void;
}

export default function MakeupRequestModal({
  originalClass,
  originalDate,
  availableClasses,
  currentWeekStart,
  onClose,
  onSubmit,
}: MakeupRequestModalProps) {
  // The makeup class is already selected (first in availableClasses)
  const makeupClass = availableClasses[0];

  // Calculate date for a repeating class in the current week
  const getDateForClassInWeek = (cls: Class, weekStart: Date): Date => {
    if (cls.repeatsWeekly && cls.dayOfWeek !== undefined) {
      // Calculate the date in the current week
      const weekStartCopy = new Date(weekStart);
      weekStartCopy.setHours(0, 0, 0, 0);
      const dayOfWeek = cls.dayOfWeek;

      // Get the date of the class in this week
      const classDate = new Date(weekStartCopy);
      const daysToAdd = dayOfWeek - weekStartCopy.getDay();
      classDate.setDate(weekStartCopy.getDate() + daysToAdd);

      // Set the time from the class startTime
      const classStartTime = new Date(cls.startTime);
      classDate.setHours(
        classStartTime.getHours(),
        classStartTime.getMinutes(),
        0,
        0
      );

      return classDate;
    } else {
      // For single classes, use the class start time
      return new Date(cls.startTime);
    }
  };

  const makeupDate = makeupClass
    ? getDateForClassInWeek(makeupClass, currentWeekStart)
    : null;

  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeupClass || !makeupDate || !reason.trim()) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    onSubmit(makeupClass._id!.toString(), makeupDate, reason);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100]"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ borderColor: colors.brown, borderWidth: "2px" }}
      >
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: colors.darkBrown }}
        >
          Xin học bù
        </h3>

        <div className="mb-4 space-y-2">
          {makeupClass && makeupDate && (
            <>
              <div>
                <span
                  className="font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Lớp học bù:
                </span>{" "}
                <span style={{ color: colors.brown }}>{makeupClass.name}</span>
              </div>
              <div>
                <span
                  className="font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Ngày học bù:
                </span>{" "}
                <span style={{ color: colors.brown }}>
                  {makeupDate.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  (
                  {makeupDate.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(makeupClass.endTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  )
                </span>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: colors.darkBrown }}
            >
              Lý do xin học bù *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded"
              style={{
                borderColor: colors.brown,
                color: colors.darkBrown,
              }}
              rows={3}
              placeholder="Nhập lý do..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
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
              type="submit"
              className="px-4 py-2 rounded text-white transition-colors"
              style={{
                backgroundColor: colors.mediumGreen,
              }}
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
