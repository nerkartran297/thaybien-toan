"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { QuizSession } from "@/models/QuizSession";
import { Quiz, AnswerOption } from "@/models/Quiz";
import Link from "next/link";
import Image from "next/image";

interface QuizStats {
  questionIndex: number;
  totalAnswers: number;
  counts: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  percentages: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  correctAnswer: AnswerOption | null;
}

export default function StudentQuizPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [session, setSession] = useState<QuizSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(
    null
  );
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);

  const checkIfAnswered = useCallback(
    async (questionIndex?: number) => {
      if (!session || !user) return;

      // Use provided questionIndex or current session questionIndex
      const targetQuestionIndex = questionIndex ?? session.currentQuestionIndex;

      try {
        // Check if student has answered by fetching their answer for current question
        const response = await fetch(
          `/api/games/rooms/${roomId}/quiz/answer/check?questionIndex=${targetQuestionIndex}`
        );
        if (response.ok) {
          const data = await response.json();
          // Only update state if this is for the current question
          if (
            data.hasAnswered &&
            targetQuestionIndex === session.currentQuestionIndex
          ) {
            setHasAnswered(true);
            setSelectedAnswer(data.answer);
          }
        }
      } catch (error) {
        // Silently fail - not critical
        console.error("Error checking if answered:", error);
      }
    },
    [session, user, roomId]
  );

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/rooms/${roomId}/quiz/session`);
      if (response.ok) {
        const data = await response.json();
        const prevQuestionIndex = session?.currentQuestionIndex;

        // Reset answer state when question changes - do this BEFORE updating session
        if (data.currentQuestionIndex !== prevQuestionIndex) {
          setSelectedAnswer(null);
          setHasAnswered(false);
          setStats(null);
        }

        setSession(data);

        // Check if student has already answered current question - only for NEW question
        if (
          data.isQuestionActive &&
          data.questionStartTime &&
          data.currentQuestionIndex !== prevQuestionIndex
        ) {
          // Use setTimeout to ensure state is reset before checking
          setTimeout(() => {
            checkIfAnswered(data.currentQuestionIndex);
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  }, [roomId, session?.currentQuestionIndex, checkIfAnswered]);

  const fetchQuiz = useCallback(async () => {
    if (!session?.quizId) return;
    try {
      const response = await fetch(`/api/quizzes/${session.quizId}`);
      if (response.ok) {
        const data = await response.json();
        setQuiz(data);
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  }, [session?.quizId]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchSession();
    }
  }, [user, roomId, fetchSession]);

  useEffect(() => {
    if (session?.quizId) {
      fetchQuiz();
    }
  }, [session?.quizId, fetchQuiz]);

  // Polling: Fetch session every 2 seconds
  useEffect(() => {
    if (!session || session.isCompleted) return;

    const interval = setInterval(() => {
      fetchSession();
      if (session.isQuestionActive && session.questionStartTime) {
        updateTimer();
        // Only check if answered for current question - fetchSession will handle reset
        if (!hasAnswered) {
          // Small delay to ensure state is reset first
          setTimeout(() => {
            checkIfAnswered();
          }, 200);
        }
      }
      if (session.isQuestionActive) {
        fetchStats();
      }
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session?.isQuestionActive,
    session?.isCompleted,
    session?.currentQuestionIndex,
    hasAnswered,
  ]);

  // Timer countdown
  useEffect(() => {
    if (
      !session?.isQuestionActive ||
      !session.questionStartTime ||
      hasAnswered
    ) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(session.questionStartTime!);
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
      const currentQuestion = quiz?.questions[session.currentQuestionIndex];
      if (currentQuestion) {
        const remaining = currentQuestion.timeLimit - elapsed;
        setTimeLeft(Math.max(0, remaining));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [
    session?.isQuestionActive,
    session?.questionStartTime,
    session?.currentQuestionIndex,
    hasAnswered,
    quiz,
  ]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/games/rooms/${roomId}/quiz/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateTimer = () => {
    if (!session?.questionStartTime || hasAnswered) return;
    const now = new Date();
    const start = new Date(session.questionStartTime);
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
    const currentQuestion = quiz?.questions[session.currentQuestionIndex];
    if (currentQuestion) {
      const remaining = currentQuestion.timeLimit - elapsed;
      setTimeLeft(Math.max(0, remaining));
    }
  };

  const handleSubmitAnswer = async (answer: AnswerOption) => {
    if (hasAnswered || !session?.isQuestionActive) return;

    try {
      const response = await fetch(`/api/games/rooms/${roomId}/quiz/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      if (response.ok) {
        setSelectedAnswer(answer);
        setHasAnswered(true);
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Đã có lỗi xảy ra");
    }
  };

  // Auto-redirect when quiz is completed
  useEffect(() => {
    if (session?.isCompleted) {
      router.push(`/student/games/${roomId}`);
    }
  }, [session?.isCompleted, roomId, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]">
        <div className="text-[#2c3e50]">Đang tải...</div>
      </div>
    );
  }

  if (!session || !quiz) {
    return (
      <div className="min-h-screen bg-[#FFFBF7]">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-[#2c3e50]">Không tìm thấy quiz</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[session.currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  if (session.isCompleted) {
    return (
      <div className="min-h-screen bg-[#FFFBF7]">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178] text-center">
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">
              Quiz đã hoàn thành!
            </h2>
            <p className="text-[#6C584C] mb-4">Đang chuyển hướng...</p>
            <Link
              href={`/student/games/${roomId}`}
              className="inline-block bg-[#ADC178] text-[#2c3e50] px-6 py-2 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-semibold"
            >
              Xem Bảng Xếp Hạng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2c3e50] mb-2">Quiz</h1>
          <p className="text-[#6C584C]">
            Câu hỏi {session.currentQuestionIndex + 1} / {totalQuestions}
          </p>
        </div>

        {!session.isQuestionActive ? (
          <div className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178] text-center">
            <p className="text-lg text-[#2c3e50]">
              Đang chờ giáo viên bắt đầu câu hỏi...
            </p>
          </div>
        ) : (
          <>
            {/* Timer */}
            {timeLeft !== null && !hasAnswered && (
              <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-[#ADC178]">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#2c3e50]">
                    {timeLeft}s
                  </div>
                  {timeLeft === 0 && (
                    <p className="text-sm text-red-600 mt-2">Hết thời gian!</p>
                  )}
                </div>
              </div>
            )}

            {/* Question */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-[#ADC178]">
              <h2 className="text-xl font-bold text-[#2c3e50] mb-4">
                Câu hỏi {session.currentQuestionIndex + 1}
              </h2>
              {currentQuestion && (
                <div className="space-y-4">
                  <p className="text-lg text-[#2c3e50]">
                    {currentQuestion.question}
                  </p>
                  {currentQuestion.imageUrl && (
                    <div
                      className="mt-3 relative w-full"
                      style={{ minHeight: "200px" }}
                    >
                      <Image
                        src={currentQuestion.imageUrl}
                        alt="Câu hỏi"
                        fill
                        className="object-contain rounded-lg border border-[#ADC178]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {(["A", "B", "C", "D"] as AnswerOption[]).map((option) => {
                      const isSelected = selectedAnswer === option;
                      const isDisabled =
                        hasAnswered || !session.isQuestionActive;
                      const isCorrect = stats?.correctAnswer === option;
                      const showResults = stats && !session.isQuestionActive;

                      return (
                        <button
                          key={option}
                          onClick={() => handleSubmitAnswer(option)}
                          disabled={isDisabled}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? "bg-[#ADC178] border-[#A98467] text-[#2c3e50] font-semibold"
                              : "bg-[#F0EAD2] border-[#ADC178] text-[#2c3e50] hover:bg-[#DDE5B6]"
                          } ${
                            isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          } ${
                            showResults && isCorrect
                              ? "ring-2 ring-green-500"
                              : ""
                          }`}
                        >
                          <strong>{option}:</strong>{" "}
                          {currentQuestion.options[option]}
                          {showResults && isCorrect && (
                            <span className="ml-2 text-green-700">✓ Đúng</span>
                          )}
                          {showResults && isSelected && !isCorrect && (
                            <span className="ml-2 text-red-700">✗ Sai</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Answer Status */}
            {hasAnswered && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-[#ADC178]">
                <p className="text-lg text-[#2c3e50] text-center">
                  Bạn đã trả lời: <strong>{selectedAnswer}</strong>
                </p>
                <p className="text-sm text-[#6C584C] text-center mt-2">
                  Đang chờ giáo viên kết thúc câu hỏi...
                </p>
              </div>
            )}

            {/* Statistics (shown after teacher ends question) */}
            {stats && !session.isQuestionActive && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178]">
                <h3 className="text-xl font-bold text-[#2c3e50] mb-4">
                  Kết Quả Câu Hỏi
                </h3>
                <div className="space-y-3">
                  <div className="text-sm text-[#6C584C] mb-2">
                    Tổng số câu trả lời: {stats.totalAnswers}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(["A", "B", "C", "D"] as AnswerOption[]).map((option) => {
                      const isCorrect = stats.correctAnswer === option;
                      return (
                        <div
                          key={option}
                          className={`p-3 rounded border ${
                            isCorrect
                              ? "bg-[#DDE5B6] border-green-500"
                              : "bg-[#F0EAD2] border-[#ADC178]"
                          }`}
                        >
                          <div className="font-semibold text-[#2c3e50]">
                            {option}
                            {isCorrect && (
                              <span className="ml-2 text-green-700">✓</span>
                            )}
                          </div>
                          <div className="text-2xl font-bold text-[#6C584C]">
                            {stats.percentages[option]}%
                          </div>
                          <div className="text-sm text-[#6C584C]">
                            ({stats.counts[option]} người)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
