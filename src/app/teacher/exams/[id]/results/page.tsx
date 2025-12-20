"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Exam } from "@/models/Exam";
import { ExamAttempt } from "@/models/ExamAttempt";
import { Class } from "@/models/Class";
import { User } from "@/models/User";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

interface AttemptWithStudentInfo extends ExamAttempt {
  studentName: string;
  className: string | null;
  grade: number | null;
}

export default function ExamResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithStudentInfo[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("Tất cả");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher" && examId) {
      fetchData();
    }
  }, [user, examId]);

  const fetchData = async () => {
    try {
      // Fetch exam details
      const examResponse = await fetch(`/api/exams/${examId}`);
      if (!examResponse.ok) {
        alert("Không tìm thấy đề thi");
        router.push("/teacher/exams");
        return;
      }
      const examData = await examResponse.json();
      setExam(examData);

      // Fetch all attempts for this exam
      const attemptsResponse = await fetch(`/api/exam-attempts?role=teacher&examId=${examId}`);
      if (!attemptsResponse.ok) {
        alert("Không thể lấy kết quả");
        return;
      }
      const attemptsData = await attemptsResponse.json();

      // Fetch all classes
      const classesResponse = await fetch("/api/classes?isActive=true");
      const classesData = classesResponse.ok ? await classesResponse.json() : [];
      setAllClasses(classesData);

      // Fetch all students with their profiles (including grade)
      const studentsResponse = await fetch("/api/students");
      const allStudents: (User & { grade?: number | null; group?: string | null })[] = studentsResponse.ok
        ? await studentsResponse.json()
        : [];

      // Create a map for quick lookup
      const studentMap = new Map<string, User & { grade?: number | null; group?: string | null }>();
      allStudents.forEach((student) => {
        studentMap.set(student._id?.toString() || "", student);
      });

      // Fetch student info and class for each attempt
      const attemptsWithInfo = await Promise.all(
        attemptsData.map(async (attempt: ExamAttempt) => {
          const studentIdStr = typeof attempt.studentId === "string"
            ? attempt.studentId
            : attempt.studentId?.toString();

          const student = studentMap.get(studentIdStr || "");

          // Find class that contains this student
          let className: string | null = student?.group || null;
          let grade: number | null = student?.grade || null;

          // Also check classes to get class name if student.group doesn't exist
          if (!className) {
            for (const cls of classesData) {
              const enrolledIds = cls.enrolledStudents.map((id: any) =>
                typeof id === "string" ? id : id.toString()
              );
              if (enrolledIds.includes(studentIdStr || "")) {
                className = cls.name;
                if (!grade) {
                  grade = cls.grade;
                }
                break;
              }
            }
          }

          return {
            ...attempt,
            studentName: student?.fullName || "Không xác định",
            className,
            grade,
          };
        })
      );

      // Sort by score descending
      attemptsWithInfo.sort((a, b) => (b.score || 0) - (a.score || 0));

      setAttempts(attemptsWithInfo);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // Filter attempts by class
  const filteredAttempts =
    selectedClass === "Tất cả"
      ? attempts
      : attempts.filter((attempt) => attempt.className === selectedClass);

  // Get unique classes from attempts
  const availableClasses = Array.from(
    new Set(attempts.map((a) => a.className).filter((c): c is string => c !== null))
  ).sort();

  // Calculate score distribution for chart (0-10 scale)
  const calculateScoreDistribution = () => {
    const distribution = {
      "0-2": 0,
      "2-4": 0,
      "4-5": 0,
      "5-6": 0,
      "6-7": 0,
      "7-8": 0,
      "8-9": 0,
      "9-10": 0,
    };

    filteredAttempts.forEach((attempt) => {
      if (attempt.score !== undefined && attempt.totalQuestions > 0) {
        const scoreOn10 = (attempt.score / attempt.totalQuestions) * 10;
        if (scoreOn10 >= 0 && scoreOn10 < 2) distribution["0-2"]++;
        else if (scoreOn10 >= 2 && scoreOn10 < 4) distribution["2-4"]++;
        else if (scoreOn10 >= 4 && scoreOn10 < 5) distribution["4-5"]++;
        else if (scoreOn10 >= 5 && scoreOn10 < 6) distribution["5-6"]++;
        else if (scoreOn10 >= 6 && scoreOn10 < 7) distribution["6-7"]++;
        else if (scoreOn10 >= 7 && scoreOn10 < 8) distribution["7-8"]++;
        else if (scoreOn10 >= 8 && scoreOn10 < 9) distribution["8-9"]++;
        else if (scoreOn10 >= 9 && scoreOn10 <= 10) distribution["9-10"]++;
      }
    });

    return distribution;
  };

  const scoreDistribution = calculateScoreDistribution();
  const maxCount = Math.max(...Object.values(scoreDistribution), 1);

  if (authLoading || loading || !exam) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.light }}
      >
        <div className="text-lg" style={{ color: colors.darkBrown }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      <Navigation />

      <div className="max-w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/teacher/exams")}
            className="mb-4 text-sm font-medium hover:underline"
            style={{ color: colors.brown }}
          >
            ← Quay lại danh sách đề
          </button>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: colors.darkBrown }}
          >
            Kết quả đề thi: {exam.name}
          </h1>
          {exam.grade && (
            <p className="text-lg" style={{ color: colors.brown }}>
              Khối {exam.grade} • {exam.category}
            </p>
          )}
        </div>

        <div className="flex gap-6">
          {/* Left Column - Results Table */}
          <div
            className="w-2/3 bg-white rounded-lg shadow-lg"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div className="p-6 border-b" style={{ borderColor: colors.light }}>
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-bold"
                  style={{ color: colors.darkBrown }}
                >
                  Kết quả học sinh
                </h2>
                <div className="flex items-center gap-4">
                  <label
                    className="text-sm font-medium"
                    style={{ color: colors.darkBrown }}
                  >
                    Lọc theo lớp:
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: colors.brown,
                      color: colors.darkBrown,
                    }}
                  >
                    <option value="Tất cả">Tất cả</option>
                    {availableClasses.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedClass !== "Tất cả" && (
                <p className="text-sm" style={{ color: colors.brown }}>
                  Đang xem kết quả: {selectedClass}
                </p>
              )}
            </div>

            <div>
              <table className="w-full">
                <thead className="sticky top-0 bg-white border-b" style={{ borderColor: colors.light }}>
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: colors.darkBrown }}
                    >
                      Tên học sinh
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: colors.darkBrown }}
                    >
                      Lớp
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: colors.darkBrown }}
                    >
                      Khối
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: colors.darkBrown }}
                    >
                      Thời gian làm bài
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: colors.darkBrown }}
                    >
                      Điểm
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: colors.light }}>
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm"
                        style={{ color: colors.brown }}
                      >
                        Chưa có học sinh nào hoàn thành bài thi này
                      </td>
                    </tr>
                  ) : (
                    filteredAttempts.map((attempt) => {
                      const scoreOn10 =
                        attempt.score !== undefined && attempt.totalQuestions > 0
                          ? ((attempt.score / attempt.totalQuestions) * 10).toFixed(2)
                          : "0.00";
                      return (
                        <tr key={attempt._id?.toString()} className="hover:bg-gray-50">
                          <td
                            className="px-6 py-4 text-sm font-medium"
                            style={{ color: colors.darkBrown }}
                          >
                            {attempt.studentName}
                          </td>
                          <td
                            className="px-6 py-4 text-sm"
                            style={{ color: colors.brown }}
                          >
                            {attempt.className || "-"}
                          </td>
                          <td
                            className="px-6 py-4 text-sm"
                            style={{ color: colors.brown }}
                          >
                            {attempt.grade ? `Khối ${attempt.grade}` : "-"}
                          </td>
                          <td
                            className="px-6 py-4 text-sm"
                            style={{ color: colors.brown }}
                          >
                            {attempt.timeSpent || 0} phút
                          </td>
                          <td
                            className="px-6 py-4 text-sm font-semibold"
                            style={{
                              color:
                                parseFloat(scoreOn10) >= 7
                                  ? "#10B981"
                                  : parseFloat(scoreOn10) >= 5
                                  ? "#F59E0B"
                                  : "#DC2626",
                            }}
                          >
                            {scoreOn10}/10
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column - Score Distribution Chart */}
          <div
            className="w-1/3 bg-white rounded-lg shadow-lg"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div className="p-6 border-b" style={{ borderColor: colors.light }}>
              <h2
                className="text-xl font-bold"
                style={{ color: colors.darkBrown }}
              >
                Phổ điểm
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
              {Object.entries(scoreDistribution).map(([range, count]) => {
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={range}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-sm font-medium"
                        style={{ color: colors.darkBrown }}
                      >
                        {range}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: colors.brown }}
                      >
                        {count} học sinh
                      </span>
                    </div>
                    <div
                      className="h-6 rounded-full relative"
                      style={{
                        backgroundColor: colors.light + "80", // Background màu nhạt với opacity
                      }}
                    >
                      <div
                        className="h-6 rounded-full absolute top-0 left-0"
                        style={{
                          backgroundColor: colors.mediumGreen,
                          width: `${percentage}%`,
                          minWidth: count > 0 ? "8px" : "0",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              </div>

              {filteredAttempts.length === 0 && (
                <p
                  className="text-sm text-center mt-8"
                  style={{ color: colors.brown }}
                >
                  Chưa có dữ liệu để hiển thị
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

