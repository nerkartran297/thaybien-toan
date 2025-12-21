"use client";

import { useState } from "react";
import { User, CreateUserData } from "@/models/User";
import { Class } from "@/models/Class";

interface StudentFormProps {
  student?: User;
  classes: Class[];
  onClose: () => void;
  onSave: (studentData: CreateUserData, classId?: string) => Promise<void>;
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
  classes,
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

  // Enrollment functionality has been removed
  const [selectedClass, setSelectedClass] = useState<string>("");
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

      // Enrollment functionality has been removed
      // Class assignment is optional and handled separately
      await onSave(studentPayload, selectedClass || undefined);
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

          {/* Class Assignment (only for new students) */}
          {!student && (
            <div className="space-y-4">
              <h4
                className="text-lg font-semibold"
                style={{ color: colors.darkBrown }}
              >
                Thêm vào lớp học (Tùy chọn)
              </h4>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Chọn lớp
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  style={{ borderColor: colors.brown }}
                >
                  <option value="">Không thêm vào lớp nào</option>
                  {classes.map((cls) => (
                    <option
                      key={cls._id?.toString()}
                      value={cls._id?.toString()}
                    >
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
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
