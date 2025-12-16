"use client";

import React, { useState } from "react";
import { CreateClassData, ClassSession } from "@/models/Class";
import Select from "./Select";
import DaySelector from "./DaySelector";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

interface CreateClassModalProps {
  onClose: () => void;
  onSubmit: (data: CreateClassData) => void;
  initialData?: Partial<CreateClassData>;
}

const GRADES = [6, 7, 8, 9, 10, 11, 12];

export default function CreateClassModal({
  onClose,
  onSubmit,
  initialData,
}: CreateClassModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    grade: initialData?.grade?.toString() || "",
    sessions: (initialData?.sessions || []) as ClassSession[],
  });

  const [newSession, setNewSession] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
  });

  const addSession = () => {
    if (!newSession.dayOfWeek || !newSession.startTime || !newSession.endTime) {
      alert("Vui lòng điền đầy đủ thông tin ca học");
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newSession.startTime) || !timeRegex.test(newSession.endTime)) {
      alert("Vui lòng nhập thời gian đúng định dạng HH:mm");
      return;
    }

    // Validate end time is after start time
    const [startHour, startMin] = newSession.startTime.split(':').map(Number);
    const [endHour, endMin] = newSession.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      alert("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    const session: ClassSession = {
      dayOfWeek: parseInt(newSession.dayOfWeek),
      startTime: newSession.startTime,
      endTime: newSession.endTime,
    };

    setFormData({
      ...formData,
      sessions: [...formData.sessions, session],
    });

    // Reset new session form
    setNewSession({
      dayOfWeek: "",
      startTime: "",
      endTime: "",
    });
  };

  const removeSession = (index: number) => {
    setFormData({
      ...formData,
      sessions: formData.sessions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.grade) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (formData.sessions.length === 0) {
      alert("Vui lòng thêm ít nhất một ca học");
      return;
    }

    const submitData: CreateClassData = {
      name: formData.name,
      grade: parseInt(formData.grade),
      sessions: formData.sessions,
    };

    onSubmit(submitData);
  };

  const daysOfWeekLabels = [
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
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full mx-4 h-[85vh] flex flex-col"
        style={{ borderColor: colors.brown, borderWidth: "2px" }}
      >
        <div className="p-6 flex-shrink-0">
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: colors.darkBrown }}
          >
            {initialData ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
          </h3>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-6 pb-4 overflow-y-auto flex-1 space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.darkBrown }}
              >
                Tên lớp *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: colors.brown,
                  color: colors.darkBrown,
                }}
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.darkBrown }}
              >
                Khối *
              </label>
              <Select
                value={formData.grade}
                onChange={(value) =>
                  setFormData({ ...formData, grade: value })
                }
                options={GRADES.map((grade) => ({
                  value: grade.toString(),
                  label: `Khối ${grade}`,
                }))}
                placeholder="Chọn khối"
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.darkBrown }}
              >
                Ca học *
              </label>
              <div className="space-y-3">
                {/* List of added sessions */}
                {formData.sessions.map((session, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg flex items-center justify-between"
                    style={{ backgroundColor: colors.light }}
                  >
                    <div className="flex-1">
                      <span className="font-medium">
                        {daysOfWeekLabels[session.dayOfWeek]}
                      </span>
                      <span className="ml-2">
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSession(index)}
                      className="px-3 py-1 rounded text-sm font-medium"
                      style={{
                        backgroundColor: "#DC2626",
                        color: "white",
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                ))}

                {/* Form to add new session */}
                <div
                  className="p-4 rounded-lg border-2 border-dashed"
                  style={{ borderColor: colors.brown }}
                >
                  <div className="space-y-3">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: colors.darkBrown }}
                      >
                        Thứ trong tuần
                      </label>
                      <DaySelector
                        value={newSession.dayOfWeek}
                        onChange={(value) =>
                          setNewSession({ ...newSession, dayOfWeek: value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: colors.darkBrown }}
                        >
                          Thời gian bắt đầu (HH:mm)
                        </label>
                        <input
                          type="text"
                          value={newSession.startTime}
                          onChange={(e) => {
                            const value = e.target.value;
                            const formatted = value
                              .replace(/[^\d:]/g, "")
                              .replace(/^(\d{2})(\d)/, "$1:$2")
                              .replace(/^(\d{2}):(\d{2}).*/, "$1:$2");
                            setNewSession({ ...newSession, startTime: formatted });
                          }}
                          placeholder="08:00"
                          pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                          className="w-full p-2 border rounded"
                          style={{ borderColor: colors.brown }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: colors.darkBrown }}
                        >
                          Thời gian kết thúc (HH:mm)
                        </label>
                        <input
                          type="text"
                          value={newSession.endTime}
                          onChange={(e) => {
                            const value = e.target.value;
                            const formatted = value
                              .replace(/[^\d:]/g, "")
                              .replace(/^(\d{2})(\d)/, "$1:$2")
                              .replace(/^(\d{2}):(\d{2}).*/, "$1:$2");
                            setNewSession({ ...newSession, endTime: formatted });
                          }}
                          placeholder="09:30"
                          pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                          className="w-full p-2 border rounded"
                          style={{ borderColor: colors.brown }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addSession}
                      className="w-full px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: colors.mediumGreen }}
                    >
                      Thêm ca học
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed buttons at bottom */}
          <div
            className="p-6 pt-4 border-t flex justify-end gap-2 flex-shrink-0"
            style={{ borderColor: colors.light }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition-colors font-medium"
              style={{
                backgroundColor: colors.light,
                color: colors.darkBrown,
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white transition-colors font-medium"
              style={{
                backgroundColor: colors.mediumGreen,
              }}
            >
              {initialData ? "Cập nhật" : "Tạo lớp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
