"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useExam } from "@/contexts/ExamContext";
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

export default function TakeExamPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeAttempt, startExam, submitExam } = useExam();
  const { isExamInProgress } = useBlockNavigation();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = params.id as string;
  const retake = searchParams.get("retake") === "true";

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0); // seconds
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student" && examId) {
      fetchExamAndStartAttempt();
    }
  }, [user, examId]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: unknown }).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Timer effect
  useEffect(() => {
    // Only start timer if we have valid conditions
    if (timeRemaining > 0 && startedAt && !attempt?.submittedAt) {
      // Clear any existing interval first
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Auto submit when time is up
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Clear interval if conditions not met
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
  }, [startedAt, attempt?.submittedAt]); // Removed timeRemaining from dependencies

  const fetchExamAndStartAttempt = async () => {
    try {
      // Fetch exam details
      const examResponse = await fetch(`/api/exams/${examId}`);
      if (!examResponse.ok) {
        alert("Không tìm thấy đề thi");
        router.push("/student/exams");
        return;
      }
      const examData = await examResponse.json();
      setExam(examData);

      // Check if we have an active attempt in context for this exam
      if (activeAttempt && activeAttempt.examId === examId) {
        // Use the attempt from context
        const attemptResponse = await fetch(`/api/exam-attempts/${activeAttempt.attemptId}`);
        if (attemptResponse.ok) {
          const existingAttempt = await attemptResponse.json();
          if (!existingAttempt.submittedAt) {
            setAttempt(existingAttempt);
            const startedAtDate = new Date(activeAttempt.startedAt);
            const timeSpent = Math.floor(
              (new Date().getTime() - startedAtDate.getTime()) / 1000
            );
            const totalTime = examData.timeLimit * 60;
            setTimeRemaining(Math.max(0, totalTime - timeSpent));
            setStartedAt(startedAtDate);
            return; // Exit early, we have the attempt
          } else {
            // Attempt was submitted, redirect to review page
            router.push(`/student/exams/${examId}/review?attemptId=${activeAttempt.attemptId}`);
            return;
          }
        }
      }

      // Check if there's an existing attempt in database
      const attemptsResponse = await fetch(`/api/exam-attempts?examId=${examId}`);
      if (attemptsResponse.ok) {
        const attempts = await attemptsResponse.json();
        
        // If retake is requested, skip checking for submitted attempts and create new attempt
        if (!retake) {
          // Check for submitted attempts first - if found, redirect to review
          const submittedAttempt = attempts.find(
            (a: ExamAttempt) => a.submittedAt
          );
          if (submittedAttempt) {
            // Redirect to the most recent submitted attempt
            router.push(`/student/exams/${examId}/review?attemptId=${submittedAttempt._id}`);
            return;
          }
        }
        
        // Look for unsubmitted attempt (only if not retaking)
        if (!retake) {
          const existingAttempt = attempts.find(
            (a: ExamAttempt) => !a.submittedAt
          );

          if (existingAttempt) {
            // Resume existing attempt
            setAttempt(existingAttempt);
            // Calculate remaining time
            const startedAtDate = new Date(existingAttempt.startedAt);
            const timeSpent = Math.floor(
              (new Date().getTime() - startedAtDate.getTime()) / 1000
            );
            const totalTime = examData.timeLimit * 60; // Convert to seconds
            setTimeRemaining(Math.max(0, totalTime - timeSpent));
            setStartedAt(startedAtDate);
            
            // Update context
            startExam(examId, existingAttempt._id?.toString() || "", startedAtDate);
            return;
          }
        }
        
        // Create new attempt (either no existing attempt or retake requested)
        const newAttempt = await createNewAttempt(examData.timeLimit);
        const startedAtDate = new Date();
        setAttempt(newAttempt);
        setTimeRemaining(examData.timeLimit * 60);
        setStartedAt(startedAtDate);
        
        // Update context
        startExam(examId, newAttempt._id?.toString() || "", startedAtDate);
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      alert("Có lỗi xảy ra khi tải đề thi");
      router.push("/student/exams");
    } finally {
      setLoading(false);
    }
  };

  const createNewAttempt = async (timeLimit: number) => {
    const response = await fetch("/api/exam-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examId,
        startedAt: new Date(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create attempt");
    }

    return await response.json();
  };

  const handleSelectAnswer = async (questionIndex: number, answer: AnswerOption) => {
    if (!attempt || attempt.submittedAt) return;

    const newAnswers = [...(attempt.answers || [])];
    newAnswers[questionIndex] = answer;

    // Update local state immediately
    setAttempt({ ...attempt, answers: newAnswers });

    // Save to server (auto-save)
    try {
      await fetch(`/api/exam-attempts/${attempt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: newAnswers }),
      });
    } catch (error) {
      console.error("Error saving answer:", error);
    }
  };

  const handleSubmit = async () => {
    if (!attempt || !exam) return;

    setSubmitting(true);
    try {
      const timeSpent = Math.floor(
        (new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000 / 60
      );

      const response = await fetch(`/api/exam-attempts/${attempt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: attempt.answers,
          submittedAt: new Date(),
          timeSpent,
        }),
      });

      if (response.ok) {
        const updatedAttempt = await response.json();
        setAttempt(updatedAttempt);
        setShowSubmitModal(false);
        setResult({
          score: updatedAttempt.score || 0,
          total: updatedAttempt.totalQuestions,
        });
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        // Clear exam context
        submitExam();
        // Show result modal - let user choose what to do next
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

  const handleAutoSubmit = async () => {
    if (!attempt || attempt.submittedAt || submitting) return;
    setShowSubmitModal(false);
    await handleSubmit();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (authLoading || loading || !exam || !attempt) {
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

  const totalQuestions = exam.answers?.length || 0;
  const studentAnswers = attempt.answers || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      <Navigation />

      <div className="max-w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: colors.darkBrown }}
          >
            Làm Bài: {exam.name}
          </h1>
        </div>

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

              {/* Timer */}
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
              {exam.filePath && !pdfLoadError ? (
                <>
                  {/* Mobile: Optimized for Android and iOS */}
                  {isMobile ? (
                    <iframe
                      src={`${exam.filePath}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width`}
                      className="w-full h-full border-0"
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "calc(100vh - 200px)",
                        border: "none",
                        WebkitOverflowScrolling: "touch",
                        touchAction: "pan-y",
                      }}
                      title="Đề thi PDF"
                      allow="fullscreen"
                      scrolling="yes"
                      onError={() => setPdfLoadError(true)}
                      onLoad={(e) => {
                        // Optimize for mobile browsers
                        try {
                          const iframe = e.currentTarget as HTMLIFrameElement;
                          // Set viewport for mobile
                          if (iframe.contentDocument) {
                            const viewport = iframe.contentDocument.querySelector('meta[name="viewport"]');
                            if (!viewport) {
                              const meta = iframe.contentDocument.createElement('meta');
                              meta.name = 'viewport';
                              meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
                              iframe.contentDocument.head.appendChild(meta);
                            }
                          }
                        } catch (error) {
                          // Cross-origin or other error, ignore
                          console.log("Cannot optimize iframe:", error);
                        }
                      }}
                    />
                  ) : (
                    /* Desktop: Use iframe */
                    <iframe
                      src={`${exam.filePath}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                      className="w-full h-full border-0"
                      style={{
                        minHeight: "600px",
                        width: "100%",
                        height: "100%",
                      }}
                      title="Đề thi PDF"
                      allow="fullscreen"
                      onError={() => setPdfLoadError(true)}
                    />
                  )}
                </>
              ) : (
                /* Fallback if PDF fails to load */
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <p className="mb-4 text-lg" style={{ color: colors.darkBrown }}>
                    {isMobile 
                      ? "Trình duyệt không hỗ trợ xem PDF trực tiếp. Vui lòng tải về để xem."
                      : "Không thể tải PDF. Vui lòng thử lại hoặc tải về để xem."}
                  </p>
                  {exam.filePath && (
                    <>
                      <a
                        href={exam.filePath}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90 mb-3"
                        style={{ backgroundColor: colors.brown }}
                      >
                        Tải PDF về
                      </a>
                      {isMobile && (
                        <a
                          href={exam.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 rounded-lg font-medium transition-colors hover:opacity-90"
                          style={{
                            backgroundColor: colors.light,
                            color: colors.darkBrown,
                          }}
                        >
                          Mở trong tab mới
                        </a>
                      )}
                    </>
                  )}
                  {!isMobile && (
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
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Answer Sheet - Hidden on mobile */}
          <div
            className="hidden md:flex w-96 bg-white rounded-lg shadow-lg flex flex-col flex-shrink-0"
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
                            onClick={() => handleSelectAnswer(index, option)}
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

        {/* Mobile: Floating Answer Button */}
        <button
          type="button"
          onClick={() => {
            // Find first unanswered question or show question 1
            const firstUnanswered = studentAnswers.findIndex((ans) => !ans);
            setSelectedQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
            setShowAnswerModal(true);
          }}
          disabled={!!attempt.submittedAt}
          className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10" style={{ borderColor: colors.light }}>
              <h3
                className="text-lg font-bold"
                style={{ color: colors.darkBrown }}
              >
                Chọn đáp án
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
                          ringColor: colors.brown,
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
                  <div
                    className="text-lg font-semibold mb-3"
                    style={{ color: colors.darkBrown }}
                  >
                    Câu {selectedQuestionIndex + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {ANSWER_OPTIONS.map((option) => {
                      const isSelected =
                        studentAnswers[selectedQuestionIndex] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            handleSelectAnswer(selectedQuestionIndex, option);
                            // Keep modal open, don't close
                          }}
                          disabled={!!attempt.submittedAt}
                          className={`py-4 px-6 rounded-lg border-2 flex items-center justify-center font-semibold transition-all text-lg ${
                            isSelected
                              ? "bg-black text-white border-black"
                              : "bg-white border-gray-300 hover:border-gray-400"
                          } ${attempt.submittedAt ? "cursor-not-allowed opacity-60" : ""}`}
                          style={{
                            color: isSelected ? "white" : colors.darkBrown,
                            borderColor: isSelected
                              ? "black"
                              : colors.brown + "40",
                          }}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
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

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full mx-4 p-6"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <h3
              className="text-xl font-bold mb-4"
              style={{ color: colors.darkBrown }}
            >
              Xác nhận nộp bài
            </h3>
            <p className="mb-6" style={{ color: colors.brown }}>
              Bạn có chắc chắn muốn nộp bài không? Sau khi nộp bài, bạn không thể chỉnh sửa được nữa.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: colors.light,
                  color: colors.darkBrown,
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: colors.brown,
                }}
              >
                {submitting ? "Đang nộp..." : "Xác nhận nộp bài"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && result && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full mx-4 p-6"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
          >
            <h3
              className="text-xl font-bold mb-4 text-center"
              style={{ color: colors.darkBrown }}
            >
              Kết quả
            </h3>
            <div className="text-center mb-6">
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: colors.brown }}
              >
                {result.score}/{result.total}
              </div>
              <div className="text-lg" style={{ color: colors.darkBrown }}>
                Điểm số: {((result.score / result.total) * 10).toFixed(2)}/10
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowResultModal(false);
                  router.push(`/student/exams/${examId}/review?attemptId=${attempt?._id}`);
                }}
                className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
                style={{
                  backgroundColor: colors.brown,
                }}
              >
                Xem kết quả chi tiết
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResultModal(false);
                  router.push("/student/exams");
                }}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: colors.light,
                  color: colors.darkBrown,
                }}
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

