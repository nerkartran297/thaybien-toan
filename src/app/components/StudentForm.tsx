"use client";

import { useState } from "react";
import { User, CreateUserData } from "@/models/User";
import { Course } from "@/models/Course";
import { Class } from "@/models/Class";
import { CreateEnrollmentData } from "@/models/StudentEnrollment";

type EnrollmentDataWithoutStudentId = Omit<CreateEnrollmentData, "studentId">;

interface StudentFormProps {
  student?: User;
  courses: Course[];
  classes: Class[];
  onClose: () => void;
  onSave: (
    studentData: CreateUserData,
    enrollmentData?: EnrollmentDataWithoutStudentId | null,
    classId?: string
  ) => Promise<void>;
}

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

export default function StudentForm({
  student,
  courses,
  // classes,
  onClose,
  onSave,
}: StudentFormProps) {
  const [formData, setFormData] = useState({
    fullName: student?.fullName || "",
    username: student?.username || "",
    password: "",
    phone: student?.phone || "",
    note: student?.note || "",
    dateOfBirth: student?.dateOfBirth || "",
    address: student?.address || "",
    emergencyContact: {
      name: student?.emergencyContact?.name || "",
      phone: student?.emergencyContact?.phone || "",
      relationship: student?.emergencyContact?.relationship || "",
    },
  });

  const [enrollmentData, setEnrollmentData] = useState({
    courseId: "",
    frequency: 1 as 1 | 2,
    startDate: new Date().toISOString().split("T")[0],
    cycle: undefined as number | undefined,
    paymentMode: "default" as "default" | "custom",
    customWeeks: undefined as number | undefined,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const studentPayload: CreateUserData = {
        fullName: formData.fullName,
        username: formData.username,
        phone: formData.phone,
        role: "student",
        password: formData.password || "",
        note: formData.note || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        emergencyContact:
          formData.emergencyContact.name &&
          formData.emergencyContact.phone &&
          formData.emergencyContact.relationship
            ? formData.emergencyContact
            : undefined,
      };

      if (!student && !formData.password) {
        alert("Vui lòng nhập mật khẩu cho học viên mới");
        setLoading(false);
        return;
      }

      if (formData.password) {
        studentPayload.password = formData.password;
      }

      let enrollmentPayload = null;
      // Enrollment is created automatically when courseId and frequency are selected
      // Enrollment only tracks which course the student is enrolled in, not which class
      if (
        enrollmentData.courseId &&
        enrollmentData.frequency &&
        enrollmentData.startDate
      ) {
        enrollmentPayload = {
          courseId: enrollmentData.courseId,
          frequency: enrollmentData.frequency,
          startDate: enrollmentData.startDate,
          cycle: enrollmentData.cycle,
          paymentMode: enrollmentData.paymentMode,
          customWeeks:
            enrollmentData.paymentMode === "custom"
              ? enrollmentData.customWeeks
              : undefined,
          schedule: {
            sessions: [], // Empty sessions - class selection is separate
          },
        };
      }

      // No class assignment - students will select classes themselves from calendar
      await onSave(studentPayload, enrollmentPayload, undefined);
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Có lỗi xảy ra khi lưu thông tin học viên");
    } finally {
      setLoading(false);
    }
  };

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
          {student ? "Chỉnh sửa học viên" : "Thêm học viên mới"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4
              className="text-lg font-semibold"
              style={{ color: colors.darkBrown }}
            >
              Thông tin cơ bản
            </h4>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: colors.darkBrown }}
              >
                Họ và tên *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: colors.brown }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: colors.darkBrown }}
              >
                Tên tài khoản *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: colors.brown }}
                placeholder="Nhập tên tài khoản"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: colors.darkBrown }}
              >
                {student
                  ? "Mật khẩu mới (để trống nếu không đổi)"
                  : "Mật khẩu *"}
              </label>
              <input
                type="password"
                required={!student}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: colors.brown }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: colors.darkBrown }}
              >
                Số điện thoại *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: colors.brown }}
              />
            </div>


            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: colors.darkBrown }}
              >
                Ghi chú
              </label>
              <textarea
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: colors.brown }}
                rows={3}
                placeholder="Ghi chú về học viên này..."
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: colors.darkBrown }}
              >
                Ngày sinh
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: colors.brown }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: colors.darkBrown }}
              >
                Địa chỉ
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: colors.brown }}
                rows={2}
              />
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-4">
              <h5
                className="text-md font-semibold mb-2"
                style={{ color: colors.darkBrown }}
              >
                Liên hệ khẩn cấp
              </h5>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Tên người liên hệ
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                    style={{ borderColor: colors.brown }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                    style={{ borderColor: colors.brown }}
                  />
                </div>

                <div className="col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Mối quan hệ
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          relationship: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                    style={{ borderColor: colors.brown }}
                    placeholder="Ví dụ: Bố, Mẹ, Anh trai..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment (only for new students) */}
          {!student && (
            <div className="border-t pt-4">
              <h4
                className="text-lg font-semibold mb-4"
                style={{ color: colors.darkBrown }}
              >
                Gán khóa học
              </h4>

              {/* Step 1: Chọn khóa học */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Khóa học *
                </label>
                <select
                  value={enrollmentData.courseId}
                  onChange={(e) =>
                    setEnrollmentData({
                      ...enrollmentData,
                      courseId: e.target.value,
                      frequency: 1,
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

              {/* Step 2: Chọn tần suất học */}
              {enrollmentData.courseId && (
                <div className="mt-4">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Tần suất học *
                  </label>
                  <select
                    value={enrollmentData.frequency}
                    onChange={(e) =>
                      setEnrollmentData({
                        ...enrollmentData,
                        frequency: parseInt(e.target.value) as 1 | 2,
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
              )}

              {/* Step 3: Chọn ngày bắt đầu học */}
              {enrollmentData.courseId && enrollmentData.frequency && (
                <div className="mt-4">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Ngày bắt đầu học *
                  </label>
                  <input
                    type="date"
                    required
                    value={enrollmentData.startDate}
                    onChange={(e) =>
                      setEnrollmentData({
                        ...enrollmentData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                    style={{ borderColor: colors.brown }}
                  />
                  <p className="text-xs mt-1" style={{ color: colors.brown }}>
                    Enrollment sẽ được tạo tự động. Học sinh sẽ tự chọn lớp học
                    từ thời gian biểu sau khi đăng nhập.
                  </p>
                </div>
              )}

              {/* Step 4: Chọn chế độ tính tiền */}
              {enrollmentData.courseId && enrollmentData.frequency && (
                <div className="mt-4">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Chế độ tính tiền *
                  </label>
                  <select
                    value={enrollmentData.paymentMode}
                    onChange={(e) =>
                      setEnrollmentData({
                        ...enrollmentData,
                        paymentMode: e.target.value as "default" | "custom",
                        customWeeks: undefined, // Reset customWeeks when switching mode
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
                  <p className="text-xs mt-1" style={{ color: colors.brown }}>
                    {enrollmentData.paymentMode === "default"
                      ? "Mặc định: 1 buổi/tuần = 18 tuần (12 buổi), 2 buổi/tuần = 9 tuần (12 buổi)"
                      : "Tùy chỉnh: Nhập số tuần, số buổi = số tuần × tần suất học"}
                  </p>
                </div>
              )}

              {/* Step 5: Nhập số tuần (chỉ khi chế độ custom) */}
              {enrollmentData.courseId &&
                enrollmentData.frequency &&
                enrollmentData.paymentMode === "custom" && (
                  <div className="mt-4">
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
                      value={enrollmentData.customWeeks || ""}
                      onChange={(e) =>
                        setEnrollmentData({
                          ...enrollmentData,
                          customWeeks: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Ví dụ: 4, 6, 8..."
                      className="w-full px-3 py-2 border rounded"
                      style={{ borderColor: colors.brown }}
                    />
                    <p className="text-xs mt-1" style={{ color: colors.brown }}>
                      Số buổi sẽ được tính: {enrollmentData.customWeeks || "?"}{" "}
                      tuần × {enrollmentData.frequency} buổi/tuần ={" "}
                      {(enrollmentData.customWeeks || 0) *
                        enrollmentData.frequency}{" "}
                      buổi
                    </p>
                  </div>
                )}

              {/* Step 6: Chọn chu kỳ (tùy chọn) */}
              {enrollmentData.courseId && enrollmentData.frequency && (
                <div className="mt-4">
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
                    value={enrollmentData.cycle || ""}
                    onChange={(e) =>
                      setEnrollmentData({
                        ...enrollmentData,
                        cycle: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Ví dụ: 4, 6 (để trống = đếm 1-12)"
                    className="w-full px-3 py-2 border rounded"
                    style={{ borderColor: colors.brown }}
                  />
                  <p className="text-xs mt-1" style={{ color: colors.brown }}>
                    Nếu có chu kỳ, số buổi sẽ đếm lặp lại: 1,2,3,4,1,2,3,4...
                    (chu kỳ 4) hoặc 1,2,3,4,5,6,1,2,3,4,5,6... (chu kỳ 6). Để
                    trống sẽ đếm 1-12 bình thường.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
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
              disabled={loading}
              className="px-4 py-2 rounded text-white transition-colors"
              style={{
                backgroundColor: colors.mediumGreen,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Đang lưu..." : student ? "Cập nhật" : "Tạo học viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
