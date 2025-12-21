"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import StudentForm from "@/app/components/StudentForm";
import StudentDetailModal from "@/app/components/StudentDetailModal";
import { User, CreateUserData, UpdateUserData } from "@/models/User";
import { Course } from "@/models/Course";
import { Class } from "@/models/Class";
import {
  CreateEnrollmentData,
  UpdateEnrollmentData,
  StudentEnrollment,
} from "@/models/StudentEnrollment";

type StudentWithEnrollmentCount = User & { enrollmentCount?: number };

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

export default function StudentsManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithEnrollmentCount[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher") {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch students
      const studentsRes = await fetch("/api/students");
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      // Fetch courses
      const coursesRes = await fetch("/api/courses");
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }

      // Fetch classes
      const classesRes = await fetch("/api/classes");
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSaveStudent = async (
    studentData: CreateUserData | UpdateUserData,
    enrollmentData?: Omit<CreateEnrollmentData, "studentId"> | null,
    classId?: string
  ) => {
    try {
      let studentId: string;

      if (editingStudent) {
        // Update existing student
        const response = await fetch(`/api/students/${editingStudent._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studentData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update student");
        }

        studentId = editingStudent._id!.toString();
        setEditingStudent(null);
      } else {
        // Create new student
        const response = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studentData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create student");
        }

        const newStudent = await response.json();
        studentId = newStudent._id;

        // Enrollment is created automatically when courseId and frequency are selected
        // Enrollment only tracks which course the student is enrolled in
        if (
          enrollmentData &&
          enrollmentData.courseId &&
          enrollmentData.frequency &&
          enrollmentData.startDate
        ) {
          const enrollmentResponse = await fetch("/api/enrollments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...enrollmentData,
              studentId,
            }),
          });

          if (!enrollmentResponse.ok) {
            const error = await enrollmentResponse.json();
            console.error("Failed to create enrollment:", error);
            // Don't throw error, just log it
          }
        }

        // Adding student to class is separate from enrollment
        // Class selection can be done later from calendar
        if (classId) {
          const addToClassResponse = await fetch(
            `/api/classes/${classId}/students`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ studentId }),
            }
          );

          if (!addToClassResponse.ok) {
            const error = await addToClassResponse.json();
            console.error("Failed to add student to class:", error);
            // Don't throw error, just log it
          }
        }
      }

      await fetchData(); // Use fetchData to refresh all data including enrollment counts
      setShowCreateModal(false);
      alert(
        editingStudent
          ? "Cập nhật học viên thành công"
          : "Tạo học viên thành công"
      );
    } catch (error: unknown) {
      console.error("Error saving student:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi lưu thông tin học viên";
      alert(errorMessage);
    }
  };

  const handleUpdateStudent = async (
    studentId: string,
    data: UpdateUserData
  ) => {
    const response = await fetch(`/api/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update student");
    }

    await fetchStudents();
  };

  const handleUpdateEnrollment = async (
    enrollmentId: string,
    data: UpdateEnrollmentData
  ) => {
    const response = await fetch(`/api/enrollments/${enrollmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update enrollment");
    }
  };

  const handleCreateEnrollment = async (
    studentId: string,
    data: Partial<StudentEnrollment>
  ) => {
    const response = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        studentId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create enrollment");
    }
  };

  const handleAddToClass = async (classId: string, studentId: string) => {
    const response = await fetch(`/api/classes/${classId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add student to class");
    }
  };

  const handleRemoveFromClass = async (classId: string, studentId: string) => {
    const response = await fetch(
      `/api/classes/${classId}/students?studentId=${studentId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove student from class");
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--page-background)" }}
      >
        <div className="text-lg" style={{ color: "#6C584C" }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: colors.darkBrown }}
            >
              Quản Lý Học Sinh
            </h1>
            <p className="text-lg" style={{ color: colors.brown }}>
              Quản lý danh sách học viên và gán khóa học
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: colors.mediumGreen,
              color: "white",
            }}
          >
            + Thêm học viên
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm học viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
            style={{
              borderColor: colors.brown,
            }}
          />
        </div>

        {/* Students list */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: colors.lightGreen }}>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Tên học viên
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Email
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Số điện thoại
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Khóa học
                </th>
                <th
                  className="px-6 py-4 text-center text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "Không tìm thấy học viên nào"
                      : "Chưa có học viên nào"}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id?.toString() || ""}
                    className="border-b border-gray-200/80 hover:bg-gray-50"
                  >
                    <td
                      className="px-6 py-4 text-sm font-medium"
                      style={{ color: colors.darkBrown }}
                    >
                      {student.fullName}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {student.email || 'N/A'}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {student.phone || "-"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ color: colors.brown }}
                    >
                      {student.enrollmentCount || 0} khóa học
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1 rounded text-sm font-medium transition-colors mr-2"
                        style={{
                          backgroundColor: colors.mediumGreen,
                          color: "white",
                        }}
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setShowCreateModal(true);
                        }}
                        className="px-3 py-1 rounded text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: colors.brown,
                          color: "white",
                        }}
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Student Modal */}
      {showCreateModal && (
        <StudentForm
          student={editingStudent || undefined}
          courses={courses}
          classes={classes}
          onClose={() => {
            setShowCreateModal(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudent}
        />
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUpdateStudent={handleUpdateStudent}
          onUpdateEnrollment={handleUpdateEnrollment}
          onCreateEnrollment={handleCreateEnrollment}
          onAddToClass={handleAddToClass}
          onRemoveFromClass={handleRemoveFromClass}
        />
      )}
    </div>
  );
}
