"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
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
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    null
  );
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<
    number | null
  >(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        String((window as { opera?: unknown }).opera || "");
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase()
        );
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

      // Check if room is active OR if there's a submitted attempt (for review)
      const attemptsResponse = await fetch(
        `/api/exam-attempts?examId=${roomData.examId}&roomId=${roomId}`
      );
      let hasSubmittedAttempt = false;
      let attempts: ExamAttempt[] = [];
      let existingAttempt:
        | (ExamAttempt & { roomId?: string | { toString: () => string } })
        | undefined = undefined;

      if (attemptsResponse.ok) {
        attempts = await attemptsResponse.json();
        existingAttempt = attempts.find(
          (
            a: ExamAttempt & { roomId?: string | { toString: () => string } }
          ) => {
            const attemptRoomId =
              typeof a.roomId === "string" ? a.roomId : a.roomId?.toString();
            return attemptRoomId === roomId || attemptRoomId === roomData.id;
          }
        );
        hasSubmittedAttempt =
          existingAttempt?.submittedAt !== null &&
          existingAttempt?.submittedAt !== undefined;
      }

      // Allow access if:
      // 1. Room is active and has startTime (for taking exam)
      // 2. Room has ended but student has submitted attempt (for review)
      const roomEnded =
        !roomData.isActive ||
        (roomData.endTime && new Date(roomData.endTime) < new Date());

      if (!roomData.startTime && !hasSubmittedAttempt) {
        alert("Room chưa được bắt đầu");
        router.push(`/student/games/${roomId}`);
        return;
      }

      if (!roomData.isActive && !roomData.startTime && !hasSubmittedAttempt) {
        alert("Room chưa được bắt đầu");
        router.push(`/student/games/${roomId}`);
        return;
      }

      // If room ended but no submitted attempt, redirect
      if (roomEnded && !hasSubmittedAttempt && !roomData.startTime) {
        alert("Room đã kết thúc và bạn chưa nộp bài");
        router.push(`/student/games/${roomId}`);
        return;
      }

      // Set room start time for timer synchronization (if available)
      if (roomData.startTime) {
        setRoomStartTime(new Date(roomData.startTime));
      }

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
        const path = examData.filePath.startsWith("/")
          ? examData.filePath
          : `/${examData.filePath}`;
        setPdfUrl(path);
      }

      // Check if there's an existing attempt for this room
      if (attemptsResponse.ok && existingAttempt !== undefined) {
        if (existingAttempt) {
          // If already submitted, allow review mode
          if (existingAttempt.submittedAt) {
            setAttempt(existingAttempt);
            // Set result if available
            if (
              existingAttempt.score !== undefined &&
              existingAttempt.score !== null
            ) {
              setResult({
                score: existingAttempt.score,
                total: examData.answers?.length || 0,
              });
              setShowResultModal(true);
            }
            return; // Don't create new attempt, just show review
          }
          // Resume existing attempt
          setAttempt(existingAttempt);
        } else {
          // Only create new attempt if room is active and not ended
          if (roomData.isActive && roomData.startTime && !roomEnded) {
            const newAttempt = await createNewAttempt(examData._id, roomId);
            setAttempt(newAttempt);
          } else {
            // Room ended and no attempt, show message
            alert("Room đã kết thúc và bạn chưa nộp bài");
            router.push(`/student/games/${roomId}`);
            return;
          }
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
        ? Math.floor(
            (new Date().getTime() - roomStartTime.getTime()) / 1000 / 60
          )
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
  const isSubmitted = !!attempt.submittedAt;
  const isRoomEnded =
    !room.isActive || (room.endTime && new Date(room.endTime) < new Date());
  const isTimeExpired = timeRemaining <= 0;
  const canShowCorrectAnswers = isRoomEnded || isTimeExpired;

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
            Làm Bài Kiểm Tra: {exam.name}
          </h1>
          <p className="text-sm" style={{ color: colors.brown }}>
            Room: {room.name} ({room.code})
          </p>
        </div>

        {/* Show submitted message if already submitted */}
        {isSubmitted && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
            <p className="text-yellow-800 font-medium">
              Bạn đã nộp bài rồi. Bạn có thể xem lại đáp án của mình bên dưới.
            </p>
            <button
              onClick={() => router.push(`/student/games/${roomId}`)}
              className="mt-2 px-4 py-2 bg-[#A98467] text-white rounded-lg hover:bg-[#6C584C] transition-colors"
            >
              Quay lại Room
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)]">
          {/* Left column - Exam Info & Timer - Hidden on mobile */}
          <div
            className="hidden md:block w-80 bg-white rounded-lg shadow-lg p-6 overflow-y-auto flex-shrink-0"
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
              <div
                className="pt-4 border-t"
                style={{ borderColor: colors.light }}
              >
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
                <div
                  className="text-xs text-center mt-1"
                  style={{ color: colors.brown }}
                >
                  Thời gian: {exam.timeLimit} phút
                </div>
                {roomStartTime && (
                  <div
                    className="text-xs text-center mt-1"
                    style={{ color: colors.brown }}
                  >
                    Bắt đầu:{" "}
                    {new Date(roomStartTime).toLocaleTimeString("vi-VN")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle column - PDF Viewer */}
          <div
            className="flex-1 bg-white rounded-lg shadow-lg p-2 md:p-4 overflow-hidden flex flex-col"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            {/* Mobile: Compact header with timer */}
            <div className="md:hidden flex items-center justify-between mb-2 px-2">
              <h2
                className="text-lg font-bold"
                style={{ color: colors.darkBrown }}
              >
                Đề thi
              </h2>
              <div className="flex items-center gap-2">
                <div
                  className="text-sm font-semibold px-3 py-1 rounded"
                  style={{
                    backgroundColor:
                      timeRemaining <= 300 ? "#DC2626" : colors.lightGreen,
                    color: timeRemaining <= 300 ? "white" : colors.darkBrown,
                  }}
                >
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>

            {/* Desktop header */}
            <h2
              className="hidden md:block text-xl font-bold mb-4"
              style={{ color: colors.darkBrown }}
            >
              Đề thi
            </h2>
            <div className="flex-1 overflow-auto relative">
              {pdfUrl && !pdfLoadError ? (
                <>
                  {/* Mobile: Use object tag for better compatibility */}
                  {isMobile ? (
                    <object
                      data={pdfUrl}
                      type="application/pdf"
                      className="w-full h-full min-h-[60vh]"
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "60vh",
                        border: "none",
                      }}
                      onError={() => setPdfLoadError(true)}
                    >
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <p className="mb-4" style={{ color: colors.darkBrown }}>
                          Không thể hiển thị PDF trên thiết bị này. Vui lòng tải
                          về để xem.
                        </p>
                        <a
                          href={pdfUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg text-white font-medium"
                          style={{ backgroundColor: colors.brown }}
                        >
                          Tải PDF về
                        </a>
                      </div>
                    </object>
                  ) : (
                    /* Desktop: Use iframe */
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                      className="w-full h-full border-0"
                      style={{
                        minHeight: "600px",
                        width: "100%",
                        height: "100%",
                      }}
                      title="Đề thi PDF"
                      allow="fullscreen"
                      onError={() => setPdfLoadError(true)}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  )}
                </>
              ) : (
                /* Fallback if PDF fails to load */
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <p
                    className="mb-4 text-lg"
                    style={{ color: colors.darkBrown }}
                  >
                    Không thể tải PDF. Vui lòng thử lại hoặc tải về để xem.
                  </p>
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                      style={{ backgroundColor: colors.brown }}
                    >
                      Tải PDF về
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPdfLoadError(false)}
                    className="mt-3 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: colors.light,
                      color: colors.darkBrown,
                    }}
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Answer Sheet - Hidden on mobile */}
          <div
            className="hidden md:flex w-96 bg-white rounded-lg shadow-lg flex-col flex-shrink-0"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <div
              className="p-6 flex-shrink-0 border-b"
              style={{ borderColor: colors.light }}
            >
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
                  const correctAnswer = canShowCorrectAnswers
                    ? exam.answers?.[index] || null
                    : null;
                  const isCorrect =
                    canShowCorrectAnswers && selectedAnswer === correctAnswer;
                  const isWrong =
                    canShowCorrectAnswers &&
                    selectedAnswer &&
                    selectedAnswer !== correctAnswer;

                  return (
                    <div
                      key={index}
                      className="border-b pb-4 mb-4"
                      style={{ borderColor: colors.light }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="text-lg font-semibold"
                          style={{ color: colors.darkBrown }}
                        >
                          Câu {index + 1}
                        </div>
                        {canShowCorrectAnswers && (
                          <div
                            className="text-sm"
                            style={{ color: colors.brown }}
                          >
                            Đáp án đúng:{" "}
                            <span className="font-bold">
                              {correctAnswer || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Answer options */}
                      <div className="flex gap-3">
                        {ANSWER_OPTIONS.map((option) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrectOption =
                            canShowCorrectAnswers && option === correctAnswer;

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                !isSubmitted &&
                                handleAnswerChange(index, option)
                              }
                              disabled={isSubmitted}
                              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-all ${
                                isSelected
                                  ? "bg-black text-white border-black"
                                  : isCorrectOption && canShowCorrectAnswers
                                  ? "bg-green-500 text-white border-green-600"
                                  : "bg-white border-gray-300 hover:border-gray-400"
                              } ${
                                isSubmitted
                                  ? "cursor-not-allowed opacity-60"
                                  : ""
                              }`}
                              style={{
                                color:
                                  isSelected ||
                                  (isCorrectOption && canShowCorrectAnswers)
                                    ? "white"
                                    : colors.darkBrown,
                                borderColor: isSelected
                                  ? "black"
                                  : isCorrectOption && canShowCorrectAnswers
                                  ? "#16a34a"
                                  : colors.brown + "40",
                                backgroundColor: isSelected
                                  ? "black"
                                  : isCorrectOption && canShowCorrectAnswers
                                  ? "#22c55e"
                                  : "white",
                              }}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>

                      {/* Show result indicator */}
                      {canShowCorrectAnswers && (
                        <div className="mt-2 text-sm">
                          {isCorrect ? (
                            <span className="text-green-600 font-medium">
                              ✓ Đúng
                            </span>
                          ) : isWrong ? (
                            <span className="text-red-600 font-medium">
                              ✗ Sai (Bạn chọn: {selectedAnswer || "Chưa chọn"})
                            </span>
                          ) : !selectedAnswer ? (
                            <span className="text-gray-500">
                              Chưa chọn đáp án
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit button - Fixed at bottom */}
            {!attempt.submittedAt && (
              <div
                className="p-6 pt-4 border-t flex-shrink-0"
                style={{ borderColor: colors.light }}
              >
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

        {/* Mobile: Floating Answer Button - Always show on mobile */}
        <button
          type="button"
          onClick={() => {
            // Find first unanswered question or show question 1
            const firstUnanswered = studentAnswers.findIndex((ans) => !ans);
            setSelectedQuestionIndex(
              firstUnanswered >= 0 ? firstUnanswered : 0
            );
            setShowAnswerModal(true);
          }}
          className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95"
          style={{
            backgroundColor: colors.brown,
            color: "white",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>

      {/* Mobile: Answer Selection Modal */}
      {showAnswerModal && (
        <div
          className="md:hidden fixed inset-0 flex items-end justify-center z-[100]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setShowAnswerModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{ borderColor: colors.brown, borderTopWidth: "2px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10"
              style={{ borderColor: colors.light }}
            >
              <h3
                className="text-lg font-bold"
                style={{ color: colors.darkBrown }}
              >
                {isSubmitted ? "Xem đáp án" : "Chọn đáp án"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAnswerModal(false)}
                className="text-2xl font-bold"
                style={{ color: colors.brown }}
              >
                ×
              </button>
            </div>

            <div className="p-4">
              {/* Question selector */}
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Chọn câu hỏi
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: totalQuestions }).map((_, index) => {
                    const hasAnswer = !!studentAnswers[index];
                    const selectedAnswer = studentAnswers[index];
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedQuestionIndex(index)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          selectedQuestionIndex === index
                            ? "ring-2 ring-offset-2"
                            : ""
                        }`}
                        style={{
                          backgroundColor:
                            selectedQuestionIndex === index
                              ? colors.brown
                              : hasAnswer
                              ? colors.lightGreen
                              : colors.light,
                          color:
                            selectedQuestionIndex === index
                              ? "white"
                              : colors.darkBrown,
                        }}
                      >
                        {index + 1}
                        {selectedAnswer && (
                          <span className="block text-xs font-bold mt-0.5">
                            {selectedAnswer}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Answer options for selected question */}
              {selectedQuestionIndex !== null && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="text-lg font-semibold"
                      style={{ color: colors.darkBrown }}
                    >
                      Câu {selectedQuestionIndex + 1}
                    </div>
                    {canShowCorrectAnswers && (
                      <div className="text-sm" style={{ color: colors.brown }}>
                        Đáp án đúng:{" "}
                        <span className="font-bold">
                          {exam.answers?.[selectedQuestionIndex] || "N/A"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {ANSWER_OPTIONS.map((option) => {
                      const isSelected =
                        studentAnswers[selectedQuestionIndex] === option;
                      const correctAnswer = canShowCorrectAnswers
                        ? exam.answers?.[selectedQuestionIndex] || null
                        : null;
                      const isCorrectOption =
                        canShowCorrectAnswers && option === correctAnswer;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            if (!isSubmitted) {
                              handleAnswerChange(selectedQuestionIndex, option);
                            }
                          }}
                          disabled={isSubmitted}
                          className={`py-4 px-6 rounded-lg border-2 flex items-center justify-center font-semibold transition-all text-lg ${
                            isSelected
                              ? "bg-black text-white border-black"
                              : isCorrectOption && canShowCorrectAnswers
                              ? "bg-green-500 text-white border-green-600"
                              : "bg-white border-gray-300 hover:border-gray-400"
                          } ${
                            isSubmitted ? "cursor-not-allowed opacity-60" : ""
                          }`}
                          style={{
                            color:
                              isSelected ||
                              (isCorrectOption && canShowCorrectAnswers)
                                ? "white"
                                : colors.darkBrown,
                            borderColor: isSelected
                              ? "black"
                              : isCorrectOption && canShowCorrectAnswers
                              ? "#16a34a"
                              : colors.brown + "40",
                            backgroundColor: isSelected
                              ? "black"
                              : isCorrectOption && canShowCorrectAnswers
                              ? "#22c55e"
                              : "white",
                          }}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {canShowCorrectAnswers && (
                    <div className="mt-3 text-sm">
                      {(() => {
                        const correctAnswerForQuestion =
                          exam.answers?.[selectedQuestionIndex] || null;
                        const studentAnswerForQuestion =
                          studentAnswers[selectedQuestionIndex];
                        if (
                          studentAnswerForQuestion === correctAnswerForQuestion
                        ) {
                          return (
                            <span className="text-green-600 font-medium">
                              ✓ Đúng
                            </span>
                          );
                        } else if (studentAnswerForQuestion) {
                          return (
                            <span className="text-red-600 font-medium">
                              ✗ Sai (Bạn chọn: {studentAnswerForQuestion})
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-gray-500">
                              Chưa chọn đáp án
                            </span>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Submit button on mobile */}
              {!attempt.submittedAt && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAnswerModal(false);
                    setShowSubmitModal(true);
                  }}
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  style={{
                    backgroundColor: colors.brown,
                  }}
                >
                  {submitting ? "Đang nộp bài..." : "Nộp bài"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit confirmation modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: colors.darkBrown }}
            >
              Xác nhận nộp bài
            </h2>
            <p className="mb-6" style={{ color: colors.brown }}>
              Bạn có chắc chắn muốn nộp bài? Sau khi nộp bài, bạn không thể
              chỉnh sửa.
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
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: colors.darkBrown }}
            >
              Kết quả
            </h2>
            <div className="text-center mb-6">
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: colors.mediumGreen }}
              >
                {result.score}/{result.total}
              </div>
              <div className="text-lg" style={{ color: colors.brown }}>
                Điểm: {((result.score / result.total) * 10).toFixed(2)}/10
              </div>
            </div>
            <button
              onClick={() => {
                setShowResultModal(false);
                // Don't redirect, let user stay on page to review answers
                // They can manually go back to room
              }}
              className="w-full px-4 py-2 bg-[#A98467] text-white rounded-lg hover:bg-[#6C584C]"
            >
              Xem lại đáp án
            </button>
            <button
              onClick={() => {
                setShowResultModal(false);
                router.push(`/student/games/${roomId}`);
              }}
              className="w-full mt-2 px-4 py-2 border border-[#A98467] text-[#A98467] rounded-lg hover:bg-[#F0EAD2]"
            >
              Quay lại Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
