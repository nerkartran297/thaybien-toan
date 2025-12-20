"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ExamAttempt } from "@/models/ExamAttempt";
import dynamic from "next/dynamic";

// Dynamically import SnakeGame to avoid SSR issues
const SnakeGame = dynamic(() => import("@/app/components/SnakeGame"), {
  ssr: false,
});

interface Room {
  id: string;
  code: string;
  name: string;
  activityType?: string; // snake, quiz, exam
  gameType: string; // backward compatibility
  startTime: string | null;
  endTime: string | null;
  duration: number;
  isActive: boolean;
  examId?: string; // For exam activities
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  studentId: string;
  name: string;
  score: number;
  highestScore: number;
  currentScore?: number;
  updatedAt: string;
}

interface Participant {
  studentId: string;
  name: string;
  joinedAt: string;
}

export default function StudentGameRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomEnded, setRoomEnded] = useState(false);
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student" && params.id) {
      fetchRoom();
      fetchLeaderboard();
      fetchParticipants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id]);

  // Polling: Check room status every 3 seconds (especially for exam activities waiting to start)
  useEffect(() => {
    if (roomEnded) return; // Don't poll if room ended

    const interval = setInterval(() => {
      fetchRoom(); // Check if room was started

      // If room is active, also fetch leaderboard and participants
      if (room?.isActive) {
        fetchLeaderboard();
        fetchParticipants();
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomEnded, room?.isActive]);

  // Auto-redirect when exam room starts (only if not already submitted)
  useEffect(() => {
    if (!room || !user) return;

    const activityType = room.activityType || room.gameType;

    // If it's an exam activity and room just became active, check if already submitted
    if (
      activityType === "exam" &&
      room.isActive &&
      room.startTime &&
      room.examId
    ) {
      // Check if student has already submitted
      const checkSubmission = async () => {
        try {
          const attemptsResponse = await fetch(
            `/api/exam-attempts?examId=${room.examId}&roomId=${room.id}`
          );
          if (attemptsResponse.ok) {
            const attempts = await attemptsResponse.json();
            const submittedAttempt = attempts.find(
              (
                a: ExamAttempt & {
                  roomId?: string | { toString: () => string };
                }
              ) => {
                const attemptRoomId =
                  typeof a.roomId === "string"
                    ? a.roomId
                    : a.roomId?.toString();
                return (
                  a.submittedAt &&
                  (attemptRoomId === room.id ||
                    attemptRoomId === room.id.toString())
                );
              }
            );

            // Only redirect if NOT already submitted
            if (!submittedAttempt) {
              const timer = setTimeout(() => {
                router.push(`/student/games/${room.id}/exam`);
              }, 1000);
              return () => clearTimeout(timer);
            }
          }
        } catch (error) {
          console.error("Error checking submission:", error);
        }
      };

      checkSubmission();
    }
  }, [room, user, router]);

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/games/rooms/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data);
        const now = new Date();
        const ended =
          !data.isActive || (data.endTime && new Date(data.endTime) < now);
        setRoomEnded(ended);
      }
    } catch (error) {
      console.error("Error fetching room:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/games/rooms/${params.id}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(
        `/api/games/rooms/${params.id}/participants`
      );
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]">
        <div className="text-[#2c3e50]">Đang tải...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]">
        <div className="text-[#2c3e50]">Room không tồn tại</div>
      </div>
    );
  }

  if (showGame && room.isActive) {
    return (
      <div className="min-h-screen bg-black">
        <SnakeGame
          roomId={room.id}
          duration={room.duration}
          startTime={room.startTime}
        />
      </div>
    );
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-[#DFC273] text-[#2c3e50]";
    if (rank === 2) return "bg-[#DDE5B6] text-[#2c3e50]";
    if (rank === 3) return "bg-[#ADC178] text-[#2c3e50]";
    return "bg-white text-[#2c3e50]";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/student/games"
            className="text-[#A98467] hover:text-[#6C584C] font-semibold mb-4 inline-block"
          >
            ← Quay lại Hoạt động
          </Link>
          <h1 className="text-3xl font-bold text-[#2c3e50] mb-2">
            {room.name}
          </h1>
          <p className="text-[#6C584C]">
            Mã Room:{" "}
            <span className="font-mono font-bold text-lg text-[#A98467]">
              {room.code}
            </span>
          </p>
        </div>

        {/* Participants List */}
        {!roomEnded && participants.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-[#ADC178]">
            <h2 className="text-xl font-bold mb-4 text-[#2c3e50]">
              Học Sinh Đã Tham Gia ({participants.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {participants.map((participant) => (
                <div
                  key={participant.studentId}
                  className="bg-[#EFEBDF] rounded-lg p-3 border border-[#ADC178]"
                >
                  <p className="font-semibold text-[#2c3e50] text-sm">
                    {participant.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-[#ADC178]">
          <h2 className="text-xl font-bold mb-4 text-[#2c3e50]">
            Thông Tin Room
          </h2>
          {roomEnded ? (
            <div className="space-y-4">
              <div className="bg-[#EFEBDF] border-l-4 border-[#A98467] p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-[#A98467]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-semibold text-[#6C584C]">
                      Room đã kết thúc
                    </p>
                    <p className="text-sm text-[#A98467] mt-1">
                      Bảng xếp hạng cuối cùng đã được hiển thị bên dưới.
                    </p>
                  </div>
                </div>
              </div>
              {(() => {
                const activityType = room?.activityType || room?.gameType;
                if (activityType === "exam") {
                  return (
                    <Link
                      href={`/student/games/${room?.id || params.id}/exam`}
                      className="block w-full bg-[#ADC178] text-[#2c3e50] py-3 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-bold text-lg text-center"
                    >
                      📝 Xem Kết Quả Làm Bài
                    </Link>
                  );
                }
                return null;
              })()}
            </div>
          ) : (
            <>
              <p className="text-[#6C584C] mb-4">
                Thời gian chơi: {room.duration} phút
              </p>
              {room.startTime && (
                <p className="text-[#6C584C] mb-4">
                  Thời gian bắt đầu:{" "}
                  {(() => {
                    const date = new Date(room.startTime);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const year = date.getFullYear();
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    return `${day}/${month}/${year} ${hours}:${minutes}`;
                  })()}
                </p>
              )}
              {room.endTime && (
                <p className="text-[#6C584C] mb-4">
                  Thời gian kết thúc:{" "}
                  {(() => {
                    const date = new Date(room.endTime);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const year = date.getFullYear();
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    return `${day}/${month}/${year} ${hours}:${minutes}`;
                  })()}
                </p>
              )}
              {(() => {
                const activityType = room.activityType || room.gameType;

                // Exam activity: Show waiting message or redirect
                if (activityType === "exam") {
                  if (!room.isActive) {
                    return (
                      <div className="bg-[#EFEBDF] border-l-4 border-[#ADC178] p-4 mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#ADC178]"></div>
                          </div>
                          <div className="ml-3">
                            <p className="text-lg font-semibold text-[#6C584C]">
                              Đang chờ giáo viên bắt đầu...
                            </p>
                            <p className="text-sm text-[#A98467] mt-1">
                              Bạn sẽ tự động được chuyển đến trang làm bài khi
                              giáo viên bắt đầu.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-[#ADC178] border-l-4 border-[#A98467] p-4 mb-4">
                        <p className="text-lg font-semibold text-white">
                          Đang chuyển đến trang làm bài...
                        </p>
                      </div>
                    );
                  }
                }

                // Snake game: Show play button
                if (activityType === "snake" && room.isActive) {
                  return (
                    <button
                      onClick={() => setShowGame(true)}
                      className="w-full bg-[#ADC178] text-[#2c3e50] py-3 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-bold text-lg"
                    >
                      Bắt Đầu Chơi Game
                    </button>
                  );
                }

                // Quiz (not implemented yet)
                if (activityType === "quiz" && room.isActive) {
                  router.push(`/student/games/${room.id}/quiz`);
                  return;
                }
                if (activityType === "quiz") {
                  return (
                    <div className="bg-[#EFEBDF] border-l-4 border-[#ADC178] p-4 mb-4">
                      <p className="text-[#6C584C]">
                        Quizz đang được phát triển...
                      </p>
                    </div>
                  );
                }

                return null;
              })()}
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178]">
          <div className="bg-gradient-to-r from-[#ADC178] to-[#A98467] text-white p-4 rounded-t-lg -m-6 mb-6">
            <h2 className="text-2xl font-bold flex items-center justify-between">
              <span>🏆 Bảng Xếp Hạng{roomEnded ? " (Cuối cùng)" : ""}</span>
              {!roomEnded && (
                <span className="text-sm font-normal opacity-90">
                  Đang cập nhật real-time...
                </span>
              )}
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center text-[#6C584C] py-8">
              <p className="text-lg">Chưa có điểm số</p>
              <p className="text-sm mt-2">
                Hãy bắt đầu chơi để xuất hiện trên bảng xếp hạng!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 border ${
                    entry.rank <= 3
                      ? "border-[#DFC273] shadow-md"
                      : "border-[#ADC178]"
                  } ${getRankColor(entry.rank)}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        entry.rank === 1
                          ? "bg-[#DFC273]"
                          : entry.rank === 2
                          ? "bg-[#DDE5B6]"
                          : entry.rank === 3
                          ? "bg-[#ADC178]"
                          : "bg-[#EFEBDF]"
                      }`}
                    >
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{entry.name}</div>
                      {entry.rank <= 3 && (
                        <div className="text-xs text-[#6C584C] mt-1">
                          {entry.rank === 1 && "🏆 Vô địch"}
                          {entry.rank === 2 && "🥈 Á quân"}
                          {entry.rank === 3 && "🥉 Hạng ba"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#A98467]">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#6C584C]">điểm</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
