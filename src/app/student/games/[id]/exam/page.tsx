"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBlockNavigation } from "@/hooks/useBlockNavigation";
import { Exam, AnswerOption } from "@/models/Exam";
import { ExamAttempt } from "@/models/ExamAttempt";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

const ANSWER_OPTIONS: AnswerOption[] = ["A", "B", "C", "D"];

interface Room {
  id: string;
  code: string;
  name: string;
  activityType?: string;
  gameType: string;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  isActive: boolean;
  examId?: string;
}

export default function RoomExamPage() {
  const { user, loading: authLoading } = useAuth();
  const { isExamInProgress } = useBlockNavigation();
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  // Timer state - synchronized with room.startTime
  const [timeRemaining, setTimeRemaining] = useState(0); // seconds
  const [roomStartTime, setRoomStartTime] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student" && roomId) {
      fetchRoomAndExam();
    }
  }, [user, roomId]);

  // Timer effect - synchronized with room.startTime
  useEffect(() => {
    if (!room || !exam || !roomStartTime) return;

    // Calculate time remaining based on room.startTime
    const calculateTimeRemaining = () => {
      const now = new Date();
      const start = new Date(roomStartTime);
      const examDuration = exam.timeLimit * 60; // Convert to seconds
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
      const remaining = Math.max(0, examDuration - elapsed);
      return remaining;
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    if (timeRemaining > 0 && !attempt?.submittedAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        const remaining = calculateTimeRemaining();
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          // Auto submit when time is up
          handleAutoSubmit();
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, exam, roomStartTime, attempt?.submittedAt]);

  const fetchRoomAndExam = async () => {
    try {
      // Fetch room details
      const roomResponse = await fetch(`/api/games/rooms/${roomId}`);
      if (!roomResponse.ok) {
        alert("Không tìm thấy room");
        router.push("/student/games");
        return;
      }
      const roomData = await roomResponse.json();
      setRoom(roomData);

      // Check if it's an exam activity
      const activityType = roomData.activityType || roomData.gameType;
      if (activityType !== "exam" || !roomData.examId) {
        alert("Room này không phải là room làm bài kiểm tra");
        router.push(`/student/games/${roomId}`);
        return;
      }

      // Check if room is active
      if (!roomData.isActive || !roomData.startTime) {
        alert("Room chưa được bắt đầu");
        router.push(`/student/games/${roomId}`);
        return;
      }

      // Set room start time for timer synchronization
      setRoomStartTime(new Date(roomData.startTime));

      // Fetch exam details
      const examResponse = await fetch(`/api/exams/${roomData.examId}`);
      if (!examResponse.ok) {
        alert("Không tìm thấy đề thi");
        router.push(`/student/games/${roomId}`);
        return;
      }
      const examData = await examResponse.json();
      setExam(examData);

      // Set PDF URL - exam filePath is relative to public folder
      if (examData.filePath) {
        // If filePath starts with /, use it directly, otherwise prepend /
        const path = examData.filePath.startsWith('/') ? examData.filePath : `/${examData.filePath}`;
        setPdfUrl(path);
      }

      // Check if there's an existing attempt for this room
      const attemptsResponse = await fetch(`/api/exam-attempts?examId=${roomData.examId}&roomId=${roomId}`);
      if (attemptsResponse.ok) {
        const attempts = await attemptsResponse.json();
        const existingAttempt = attempts.find(
          (a: ExamAttempt) => !a.submittedAt && (a as any).roomId === roomId
        );

        if (existingAttempt) {
          // Resume existing attempt
          setAttempt(existingAttempt);
        } else {
          // Create new attempt
          const newAttempt = await createNewAttempt(examData._id, roomId);
          setAttempt(newAttempt);
        }
      }
    } catch (error) {
      console.error("Error fetching room and exam:", error);
      alert("Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const createNewAttempt = async (examId: string, roomId: string) => {
    const response = await fetch("/api/exam-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examId,
        roomId, // Link attempt to room
        startedAt: roomStartTime?.toISOString() || new Date().toISOString(), // Use room start time
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create attempt");
    }

    return response.json();
  };

  const handleAnswerChange = (questionIndex: number, answer: AnswerOption) => {
    if (!attempt || attempt.submittedAt) return;

    const updatedAnswers = [...(attempt.answers || [])];
    updatedAnswers[questionIndex] = answer;

    setAttempt({
      ...attempt,
      answers: updatedAnswers,
    });

    // Auto-save answers
    saveAnswers(updatedAnswers);
  };

  const saveAnswers = async (answers: (AnswerOption | null)[]) => {
    if (!attempt) return;

    try {
      await fetch(`/api/exam-attempts/${attempt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
    } catch (error) {
      console.error("Error saving answers:", error);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting || attempt?.submittedAt) return;
    await submitExam();
  };

  const handleSubmit = async () => {
    if (submitting || attempt?.submittedAt) return;
    setShowSubmitModal(false);
    await submitExam();
  };

  const submitExam = async () => {
    if (!attempt || !exam) return;

    setSubmitting(true);

    try {
      const timeSpent = roomStartTime
        ? Math.floor((new Date().getTime() - roomStartTime.getTime()) / 1000 / 60)
        : 0;

      // Submit attempt (API will calculate score automatically)
      const response = await fetch(`/api/exam-attempts/${attempt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: attempt.answers,
          submittedAt: new Date().toISOString(),
          timeSpent,
        }),
      });

      if (response.ok) {
        const submittedAttempt = await response.json();
        setAttempt(submittedAttempt);
        setResult({
          score: submittedAttempt.score || 0,
          total: submittedAttempt.totalQuestions || 0,
        });
        setShowResultModal(true);
      } else {
        const error = await response.json();
        alert(error.error || "Có lỗi xảy ra khi nộp bài");
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      alert("Có lỗi xảy ra khi nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]">
        <div className="text-[#2c3e50]">Đang tải...</div>
      </div>
    );
  }

  if (!room || !exam || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]">
        <div className="text-[#2c3e50]">Không tìm thấy đề thi hoặc room</div>
      </div>
    );
  }

  const totalQuestions = exam.answers?.length || 0;
  const studentAnswers = attempt.answers || [];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.light,
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <Navigation />
      <div className="max-w-full mx-auto px-4 py-8">
        <div className="mb-6">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: colors.darkBrown }}
            >
              Làm Bài Kiểm Tra: {exam.name || (exam as any).title}
            </h1>
          <p className="text-sm" style={{ color: colors.brown }}>
            Room: {room.name} ({room.code})
          </p>
        </div>

        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Left column - Exam Info & Timer */}
          <div
            className="w-80 bg-white rounded-lg shadow-lg p-6 overflow-y-auto flex-shrink-0"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: colors.darkBrown }}
            >
              Thông tin đề
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Tên đề
                </label>
                <div className="text-base" style={{ color: colors.brown }}>
                  {exam.name}
                </div>
              </div>

              {exam.description && (
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Mô tả
                  </label>
                  <div className="text-sm" style={{ color: colors.brown }}>
                    {exam.description}
                  </div>
                </div>
              )}

              {exam.grade && (
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: colors.darkBrown }}
                  >
                    Khối
                  </label>
                  <div className="text-base" style={{ color: colors.brown }}>
                    Khối {exam.grade}
                  </div>
                </div>
              )}

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Phân loại
                </label>
                <div className="text-base" style={{ color: colors.brown }}>
                  {exam.category}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: colors.darkBrown }}
                >
                  Tổng số câu
                </label>
                <div className="text-base" style={{ color: colors.brown }}>
                  {totalQuestions} câu
                </div>
              </div>

              {/* Timer - Synchronized with room.startTime */}
              <div className="pt-4 border-t" style={{ borderColor: colors.light }}>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Thời gian còn lại
                </label>
                <div
                  className="text-3xl font-bold text-center py-3 rounded-lg"
                  style={{
                    backgroundColor:
                      timeRemaining <= 300 ? "#DC2626" : colors.lightGreen,
                    color: timeRemaining <= 300 ? "white" : colors.darkBrown,
                  }}
                >
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-center mt-1" style={{ color: colors.brown }}>
                  Thời gian: {exam.timeLimit} phút
                </div>
                {roomStartTime && (
                  <div className="text-xs text-center mt-1" style={{ color: colors.brown }}>
                    Bắt đầu: {new Date(roomStartTime).toLocaleTimeString('vi-VN')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle column - PDF Viewer */}
          <div
            className="flex-1 bg-white rounded-lg shadow-lg p-4 overflow-hidden flex flex-col"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: colors.darkBrown }}
            >
              Đề thi
            </h2>
            <div className="flex-1 overflow-auto">
              {pdfUrl && (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-0"
                  style={{ minHeight: "600px" }}
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
            </div>
          </div>

          {/* Right column - Answer Sheet */}
          <div
            className="w-96 bg-white rounded-lg shadow-lg flex flex-col flex-shrink-0"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div className="p-6 flex-shrink-0 border-b" style={{ borderColor: colors.light }}>
              <h2
                className="text-xl font-bold"
                style={{ color: colors.darkBrown }}
              >
                Bài làm
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {Array.from({ length: totalQuestions }).map((_, index) => {
                  const selectedAnswer = studentAnswers[index] || null;
                  return (
                    <div
                      key={index}
                      className="border-b pb-4 mb-4"
                      style={{ borderColor: colors.light }}
                    >
                      <div
                        className="text-lg font-semibold mb-3"
                        style={{ color: colors.darkBrown }}
                      >
                        Câu {index + 1}
                      </div>

                      {/* Answer options */}
                      <div className="flex gap-3">
                        {ANSWER_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleAnswerChange(index, option)}
                            disabled={!!attempt.submittedAt}
                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
                              selectedAnswer === option
                                ? "bg-black text-white border-black"
                                : "bg-white border-gray-300 hover:border-gray-400"
                            } ${attempt.submittedAt ? "cursor-not-allowed opacity-60" : ""}`}
                            style={{
                              color: selectedAnswer === option ? "white" : colors.darkBrown,
                              borderColor:
                                selectedAnswer === option
                                  ? "black"
                                  : colors.brown + "40",
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit button - Fixed at bottom */}
            {!attempt.submittedAt && (
              <div className="p-6 pt-4 border-t flex-shrink-0" style={{ borderColor: colors.light }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colors.brown,
                  }}
                >
                  {submitting ? "Đang nộp bài..." : "Nộp bài"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit confirmation modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.darkBrown }}>
                Xác nhận nộp bài
              </h2>
              <p className="mb-6" style={{ color: colors.brown }}>
                Bạn có chắc chắn muốn nộp bài? Sau khi nộp bài, bạn không thể chỉnh sửa.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-[#A98467] text-white rounded-lg hover:bg-[#6C584C]"
                >
                  Nộp bài
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result modal */}
        {showResultModal && result && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: colors.darkBrown }}>
                Kết quả
              </h2>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2" style={{ color: colors.mediumGreen }}>
                  {result.score}/{result.total}
                </div>
                <div className="text-lg" style={{ color: colors.brown }}>
                  Điểm: {((result.score / result.total) * 10).toFixed(2)}/10
                </div>
              </div>
              <button
                onClick={() => {
                  setShowResultModal(false);
                  router.push(`/student/games/${roomId}`);
                }}
                className="w-full px-4 py-2 bg-[#A98467] text-white rounded-lg hover:bg-[#6C584C]"
              >
                Quay lại Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

