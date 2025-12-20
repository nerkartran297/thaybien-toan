"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";

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

interface Room {
  id: string;
  code: string;
  name: string;
  gameType: string;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  isActive: boolean;
}

interface Participant {
  studentId: string;
  name: string;
  joinedAt: string;
}

export default function RoomLeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomEnded, setRoomEnded] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher" && params.id) {
      fetchRoom();
      fetchLeaderboard();
      fetchParticipants();
    }
  }, [user, params.id]);

  useEffect(() => {
    if (!roomEnded && room?.isActive) {
      const interval = setInterval(() => {
        fetchLeaderboard();
        fetchParticipants();
      }, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [roomEnded, room]);

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
      const response = await fetch(`/api/games/rooms/${params.id}/participants`);
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
            href="/teacher/games"
            className="text-[#A98467] hover:text-[#6C584C] font-semibold mb-4 inline-block"
          >
            ← Quay lại Quản lý Rooms
          </Link>
          <h1 className="text-3xl font-bold text-[#2c3e50] mb-2">{room.name}</h1>
          <p className="text-[#6C584C]">
            Mã Room: <span className="font-mono font-bold text-lg text-[#A98467]">{room.code}</span>
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
              <p className="text-sm mt-2">Hãy bắt đầu chơi để xuất hiện trên bảng xếp hạng!</p>
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
                      <div className="font-semibold text-lg">
                        {entry.name}
                      </div>
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

