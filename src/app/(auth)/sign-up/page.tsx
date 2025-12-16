"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateUserData } from "@/models/User";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      setLoading(false);
      return;
    }

    // Validate required fields
    if (
      !formData.fullName ||
      !formData.username ||
      !formData.password ||
      !formData.phone
    ) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      setLoading(false);
      return;
    }

    try {
      const studentPayload: CreateUserData = {
        fullName: formData.fullName,
        username: formData.username,
        phone: formData.phone,
        role: "student",
        password: formData.password,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        emergencyContact:
          formData.emergencyContact.name &&
          formData.emergencyContact.phone &&
          formData.emergencyContact.relationship
            ? formData.emergencyContact
            : undefined,
      };

      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Đăng ký thất bại");
      }

      alert(
        "Đăng ký thành công! Giáo viên sẽ gán khóa học cho bạn sau. Vui lòng đăng nhập."
      );
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing up:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi đăng ký";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ backgroundColor: colors.light }}
    >
      <div
        className="bg-white rounded-lg p-8 max-w-2xl w-full shadow-lg"
        style={{ borderColor: colors.brown, borderWidth: "2px" }}
      >
        <h2
          className="text-3xl font-bold mb-2 text-center"
          style={{ color: colors.darkBrown }}
        >
          Đăng ký học viên
        </h2>
        <p className="text-center mb-6" style={{ color: colors.brown }}>
          Điền thông tin để đăng ký. Giáo viên sẽ gán khóa học cho bạn sau.
        </p>

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
                Mật khẩu *
              </label>
              <input
                type="password"
                required
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
                Xác nhận mật khẩu *
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
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


            {/* <div>
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
            </div> */}

            {/* <div>
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
            </div> */}

            {/* Emergency Contact */}
            {/* <div className="border-t pt-4"> */}
            {/* <h5
                className="text-md font-semibold mb-2"
                style={{ color: colors.darkBrown }}
              >
                Liên hệ khẩn cấp
              </h5> */}

            {/* <div className="grid grid-cols-2 gap-4"> */}
            {/* <div>
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
                </div> */}

            {/* <div>
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
                </div> */}

            {/* <div className="col-span-2">
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
                    placeholder="Ví dụ: Bố, Mẹ, Anh, Chị..."
                  />
                </div> */}
            {/* </div> */}
            {/* </div> */}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded text-white font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: colors.mediumGreen }}
            >
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded font-medium transition-colors"
              style={{
                backgroundColor: colors.light,
                color: colors.darkBrown,
              }}
            >
              Hủy
            </button>
          </div>

          <div className="text-center mt-4">
            <p style={{ color: colors.brown }}>
              Đã có tài khoản?{" "}
              <a
                href="/sign-in"
                className="font-semibold underline"
                style={{ color: colors.mediumGreen }}
              >
                Đăng nhập
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
