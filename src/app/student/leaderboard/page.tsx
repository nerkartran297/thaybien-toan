"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  score: number;
  grade: string | null;
  group: string | null;
}

export default function StudentLeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [period, setPeriod] = useState<"all" | "week" | "month" | "quarter">("all");
  const [scope, setScope] = useState<"class" | "grade">("class");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchLeaderboard();
    }
  }, [user, period, scope]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/games/leaderboard?period=${period}&scope=${scope}`
      );
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setMyRank(data.myRank);
        setMyScore(data.myScore || 0);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case "all":
        return "Toàn Thời Gian";
      case "week":
        return "Tuần Này";
      case "month":
        return "Tháng Này";
      case "quarter":
        return "Quý Này";
      default:
        return p;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]">
        <div className="text-[#2c3e50]">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-[#2c3e50] mb-6">
          🏆 Bảng Xếp Hạng
        </h1>

        {/* My Stats */}
        <div className="bg-gradient-to-r from-[#ADC178] to-[#A98467] rounded-lg shadow-md p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-4">Thống Kê Của Bạn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-90">Điểm Thi Đua</div>
              <div className="text-3xl font-bold">{myScore.toLocaleString()}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-90">Xếp Hạng</div>
              <div className="text-3xl font-bold">
                {myRank ? `#${myRank}` : "Chưa có"}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-[#ADC178]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                Thời Gian
              </label>
              <select
                value={period}
                onChange={(e) =>
                  setPeriod(
                    e.target.value as "all" | "week" | "month" | "quarter"
                  )
                }
                className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
              >
                <option value="all">Toàn Thời Gian</option>
                <option value="week">Tuần Này</option>
                <option value="month">Tháng Này</option>
                <option value="quarter">Quý Này</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                Phạm Vi
              </label>
              <select
                value={scope}
                onChange={(e) =>
                  setScope(e.target.value as "class" | "grade")
                }
                className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
              >
                <option value="class">Cùng Lớp</option>
                <option value="grade">Cùng Khối</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178]">
          <div className="bg-gradient-to-r from-[#ADC178] to-[#A98467] text-white p-4 rounded-t-lg -m-6 mb-6">
            <h2 className="text-2xl font-bold">
              Top 25 - {getPeriodLabel(period)}
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center text-[#6C584C] py-8">
              <p className="text-lg">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.studentId}
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
                      {entry.group && (
                        <div className="text-xs text-[#6C584C] mt-1">
                          {entry.group} {entry.grade && `- Khối ${entry.grade}`}
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

