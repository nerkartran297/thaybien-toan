"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { QuizSession } from "@/models/QuizSession";
import { Quiz } from "@/models/Quiz";

export default function TeacherQuizControlPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [session, setSession] = useState<QuizSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher") {
      fetchSession();
    }
  }, [user, roomId]);

  useEffect(() => {
    if (session?.quizId) {
      fetchQuiz();
    }
  }, [session?.quizId]);

  // Polling: Fetch session and stats every 2 seconds
  useEffect(() => {
    if (!session || session.isCompleted) return;

    const interval = setInterval(() => {
      fetchSession();
      if (session.isQuestionActive) {
        fetchStats();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session?.isQuestionActive, session?.isCompleted]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/games/rooms/${roomId}/quiz/session`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuiz = async () => {
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
  };

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

  const handleStartQuestion = async () => {
    try {
      const response = await fetch(
        `/api/games/rooms/${roomId}/quiz/session/start-question`,
        { method: "POST" }
      );
      if (response.ok) {
        fetchSession();
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error starting question:", error);
      alert("Đã có lỗi xảy ra");
    }
  };

  const handleNextQuestion = async () => {
    try {
      const response = await fetch(
        `/api/games/rooms/${roomId}/quiz/session/next-question`,
        { method: "PUT" }
      );
      if (response.ok) {
        fetchSession();
        setStats(null);
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error moving to next question:", error);
      alert("Đã có lỗi xảy ra");
    }
  };

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
            <p className="text-[#2c3e50]">Không tìm thấy quiz session</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[session.currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = session.currentQuestionIndex === totalQuestions - 1;

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2c3e50] mb-2">
            Điều Khiển Quiz
          </h1>
          <p className="text-[#6C584C]">
            Câu hỏi {session.currentQuestionIndex + 1} / {totalQuestions}
          </p>
        </div>

        {session.isCompleted ? (
          <div className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178]">
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-4">
              Quiz đã hoàn thành!
            </h2>
            <Link
              href={`/teacher/games/${roomId}/leaderboard`}
              className="inline-block bg-[#ADC178] text-[#2c3e50] px-6 py-2 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-semibold"
            >
              Xem Bảng Xếp Hạng
            </Link>
          </div>
        ) : (
          <>
            {/* Current Question Display */}
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
                    <div className="mt-3">
                      <img
                        src={currentQuestion.imageUrl}
                        alt="Câu hỏi"
                        className="max-w-full h-auto rounded-lg border border-[#ADC178]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Only show options when question is active (for students to see) */}
                  {session.isQuestionActive && (
                    <div className="space-y-2">
                      <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                        <strong>A:</strong> {currentQuestion.options.A}
                      </div>
                      <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                        <strong>B:</strong> {currentQuestion.options.B}
                      </div>
                      <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                        <strong>C:</strong> {currentQuestion.options.C}
                      </div>
                      <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                        <strong>D:</strong> {currentQuestion.options.D}
                      </div>
                    </div>
                  )}
                  
                  {/* Only show correct answer and explanation after question has ended (when showing stats) */}
                  {stats && !session.isQuestionActive && (
                    <>
                      <div className="space-y-2">
                        <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                          <strong>A:</strong> {currentQuestion.options.A}
                        </div>
                        <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                          <strong>B:</strong> {currentQuestion.options.B}
                        </div>
                        <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                          <strong>C:</strong> {currentQuestion.options.C}
                        </div>
                        <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                          <strong>D:</strong> {currentQuestion.options.D}
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-[#DDE5B6] rounded">
                        <strong>Đáp án đúng:</strong>{" "}
                        <span className="text-green-700 font-bold">
                          {currentQuestion.correctAnswer}
                        </span>
                      </div>
                      {currentQuestion.explanation && (
                        <div className="mt-2 p-3 bg-[#F0EAD2] rounded">
                          <strong>Giải thích:</strong> {currentQuestion.explanation}
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="mt-2 text-sm text-[#6C584C]">
                    Thời gian: {currentQuestion.timeLimit} giây
                  </div>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-[#ADC178]">
              {!session.isQuestionActive ? (
                <button
                  onClick={handleStartQuestion}
                  className="w-full bg-[#ADC178] text-[#2c3e50] px-6 py-3 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-semibold text-lg"
                >
                  Bắt Đầu Câu Hỏi
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center text-lg font-semibold text-[#2c3e50]">
                    Câu hỏi đang diễn ra...
                  </div>
                  <button
                    onClick={handleNextQuestion}
                    className="w-full bg-[#A98467] text-white px-6 py-3 rounded-lg hover:bg-[#6C584C] transition-colors font-semibold text-lg"
                  >
                    {isLastQuestion ? "Kết Thúc Quiz" : "Câu Tiếp Theo"}
                  </button>
                </div>
              )}
            </div>

            {/* Statistics */}
            {session.isQuestionActive && stats && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178]">
                <h3 className="text-xl font-bold text-[#2c3e50] mb-4">
                  Thống Kê Câu Hỏi
                </h3>
                <div className="space-y-3">
                  <div className="text-sm text-[#6C584C] mb-2">
                    Tổng số câu trả lời: {stats.totalAnswers}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                      <div className="font-semibold text-[#2c3e50]">A</div>
                      <div className="text-2xl font-bold text-[#6C584C]">
                        {stats.percentages.A}%
                      </div>
                      <div className="text-sm text-[#6C584C]">
                        ({stats.counts.A} người)
                      </div>
                    </div>
                    <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                      <div className="font-semibold text-[#2c3e50]">B</div>
                      <div className="text-2xl font-bold text-[#6C584C]">
                        {stats.percentages.B}%
                      </div>
                      <div className="text-sm text-[#6C584C]">
                        ({stats.counts.B} người)
                      </div>
                    </div>
                    <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                      <div className="font-semibold text-[#2c3e50]">C</div>
                      <div className="text-2xl font-bold text-[#6C584C]">
                        {stats.percentages.C}%
                      </div>
                      <div className="text-sm text-[#6C584C]">
                        ({stats.counts.C} người)
                      </div>
                    </div>
                    <div className="p-3 bg-[#F0EAD2] rounded border border-[#ADC178]">
                      <div className="font-semibold text-[#2c3e50]">D</div>
                      <div className="text-2xl font-bold text-[#6C584C]">
                        {stats.percentages.D}%
                      </div>
                      <div className="text-sm text-[#6C584C]">
                        ({stats.counts.D} người)
                      </div>
                    </div>
                  </div>
                  {stats.correctAnswer && (
                    <div className="mt-4 p-3 bg-[#DDE5B6] rounded border border-[#ADC178]">
                      <strong className="text-[#2c3e50]">Đáp án đúng:</strong>{" "}
                      <span className="text-green-700 font-bold text-lg">
                        {stats.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

