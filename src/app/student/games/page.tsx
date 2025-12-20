"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Room {
  id: string;
  code: string;
  name: string;
  gameType: string;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  isActive: boolean;
  createdAt?: string;
}

export default function StudentGamesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchJoinedRooms();
    }
  }, [user]);

  const fetchJoinedRooms = async () => {
    try {
      const response = await fetch("/api/games/rooms/joined");
      if (response.ok) {
        const data = await response.json();
        setJoinedRooms(data);
      }
    } catch (error) {
      console.error("Error fetching joined rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      alert("Vui lòng nhập mã phòng");
      return;
    }

    setJoining(true);
    try {
      const response = await fetch(`/api/games/rooms/join/${roomCode.trim()}`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to room page
        router.push(`/student/games/${data.roomId}`);
      } else {
        const error = await response.json();
        alert(error.error || "Không thể tham gia phòng");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Đã có lỗi xảy ra");
    } finally {
      setJoining(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
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
          Hoạt động
        </h1>

        {/* Join Room Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-[#ADC178]">
          <h2 className="text-xl font-bold mb-4 text-[#2c3e50]">
            Nhập Mã Phòng Để Tham Gia
          </h2>
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                Mã Phòng
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().trim())}
                placeholder="Nhập mã phòng (ví dụ: ABC123)"
                className="w-full px-4 py-3 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467] text-lg font-mono"
                maxLength={10}
                required
              />
            </div>
            <button
              type="submit"
              disabled={joining}
              className="w-full bg-[#ADC178] text-[#2c3e50] py-3 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "Đang tham gia..." : "Tham Gia Phòng"}
            </button>
          </form>
        </div>

        {/* Joined Rooms (Ended) */}
        {joinedRooms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-[#2c3e50]">
              Các Phòng Đã Tham Gia (Đã Kết Thúc)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-[#EFEBDF] rounded-lg shadow-md p-6 border border-[#ADC178] opacity-90"
                >
                  <h3 className="text-xl font-bold mb-2 text-[#2c3e50]">
                    {room.name}
                  </h3>
                  <p className="text-sm text-[#6C584C] mb-1">
                    Mã:{" "}
                    <span className="font-mono font-bold text-lg text-[#A98467]">
                      {room.code}
                    </span>
                  </p>
                  {room.endTime && (
                    <p className="text-sm text-[#6C584C] mb-4">
                      Kết thúc: {formatDateTime(room.endTime)}
                    </p>
                  )}
                  <Link
                    href={`/student/games/${room.id}`}
                    className="w-full bg-[#6C584C] text-white text-center py-2 rounded-lg hover:bg-[#5A1612] transition-colors font-semibold block"
                  >
                    Xem Bảng Xếp Hạng
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {joinedRooms.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178] text-center">
            <p className="text-[#6C584C]">
              Bạn chưa tham gia phòng nào. Hãy nhập mã phòng ở trên để tham gia!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

