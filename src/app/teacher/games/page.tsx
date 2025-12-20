"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "@/app/components/ui/date-time-picker";
import { Exam } from "@/models/Exam";
import { Class } from "@/models/Class";

// Exam Selector Component
function ExamSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (examId: string) => void;
}) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/exams?role=teacher");
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const selectedExam = exams.find((exam) => exam._id?.toString() === value);
  const totalQuestions = selectedExam?.answers?.length || 0;

  // Get classes that have access to this exam
  const examClassIds =
    selectedExam?.classes?.map((id) =>
      typeof id === "string" ? id : id?.toString()
    ) || [];
  const accessibleClasses = classes.filter((cls) =>
    examClassIds.includes(cls._id?.toString() || "")
  );

  if (loading) {
    return <div className="text-sm text-[#6C584C]">Đang tải...</div>;
  }

  return (
    <div className="space-y-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
        required
      >
        <option value="">-- Chọn đề thi --</option>
        {exams.map((exam) => (
          <option key={exam._id?.toString()} value={exam._id?.toString()}>
            {exam.name} ({exam.timeLimit} phút)
          </option>
        ))}
      </select>

      {selectedExam && (
        <div className="bg-[#F0EAD2] border border-[#ADC178] rounded-lg p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-[#2c3e50] text-lg">
              {selectedExam.name}
            </h4>
            {selectedExam.category && (
              <span className="inline-block mt-1 px-2 py-1 bg-[#ADC178] text-[#2c3e50] text-xs rounded">
                {selectedExam.category}
              </span>
            )}
          </div>

          {selectedExam.description && (
            <p className="text-sm text-[#6C584C]">{selectedExam.description}</p>
          )}

          <div className="flex gap-4 text-sm text-[#6C584C]">
            <div>
              <span className="font-medium">Thời gian:</span>{" "}
              {selectedExam.timeLimit} phút
            </div>
            {totalQuestions > 0 && (
              <div>
                <span className="font-medium">Số câu hỏi:</span>{" "}
                {totalQuestions} câu
              </div>
            )}
            {selectedExam.grade && (
              <div>
                <span className="font-medium">Khối:</span> {selectedExam.grade}
              </div>
            )}
          </div>

          {/* Display accessible classes */}
          <div className="border-t border-[#ADC178] pt-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm text-[#2c3e50]">
                Các lớp đã được cấp quyền truy cập:
              </span>
            </div>
            {loadingClasses ? (
              <div className="text-xs text-[#6C584C]">Đang tải...</div>
            ) : accessibleClasses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {accessibleClasses.map((cls) => (
                  <span
                    key={cls._id?.toString()}
                    className="inline-block px-2 py-1 bg-[#DDE5B6] text-[#2c3e50] text-xs rounded border border-[#ADC178]"
                  >
                    {cls.name} (Khối {cls.grade})
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#6C584C] italic">
                Chưa có lớp nào được cấp quyền truy cập
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Room {
  id: string;
  code: string;
  name: string;
  activityType: string; // snake, quiz, exam
  startTime: string | null;
  endTime: string | null;
  duration: number;
  isActive: boolean;
  createdAt: string;
  examId?: string; // For exam activities
}

export default function TeacherGamesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showEndedRooms, setShowEndedRooms] = useState(false);

  // Helper function to format date
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

  // Helper to check if room has ended
  const isRoomEnded = (room: Room) => {
    if (room.endTime) {
      const endTime = new Date(room.endTime);
      const now = new Date();
      return now > endTime;
    }
    return !room.isActive && room.endTime !== null;
  };

  // Helper to check if room has started
  const hasRoomStarted = (room: Room) => {
    return room.isActive;
  };

  // Helper to get next quarter hour as Date
  const getNextQuarterHourDate = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const nextMinutes = Math.ceil(minutes / 15) * 15;
    const nextDate = new Date(now);
    nextDate.setMinutes(nextMinutes >= 60 ? 0 : nextMinutes);
    if (nextMinutes >= 60) {
      nextDate.setHours(nextDate.getHours() + 1);
    }
    return nextDate;
  };

  const [formData, setFormData] = useState({
    name: "",
    activityType: "snake",
    startDateTime: getNextQuarterHourDate(),
    endDateTime: getNextQuarterHourDate(),
    examId: "",
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "teacher") {
      fetchRooms();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/games/rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formatForAPI = (date: Date | undefined) => {
        if (!date) return null;
        return date.toISOString();
      };

      // Calculate duration from startTime and endTime (in minutes)
      let duration = 60; // Default 60 minutes if no endTime
      if (formData.startDateTime && formData.endDateTime) {
        const diffMs =
          formData.endDateTime.getTime() - formData.startDateTime.getTime();
        duration = Math.max(1, Math.floor(diffMs / (1000 * 60))); // Convert to minutes, minimum 1 minute
      }

      // Validate examId if activityType is exam
      if (formData.activityType === "exam" && !formData.examId) {
        alert("Vui lòng chọn đề thi");
        return;
      }

      const response = await fetch("/api/games/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          activityType: formData.activityType,
          startTime: formatForAPI(formData.startDateTime),
          endTime: formatForAPI(formData.endDateTime),
          duration: duration,
          examId:
            formData.activityType === "exam" ? formData.examId : undefined,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: "",
          activityType: "snake",
          startDateTime: getNextQuarterHourDate(),
          endDateTime: getNextQuarterHourDate(),
          examId: "",
        });
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    }
  };

  const handleStartRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/games/rooms/${roomId}/start`, {
        method: "POST",
      });

      if (response.ok) {
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    }
  };

  const handleEndRoom = async (roomId: string) => {
    if (
      !confirm(
        "Bạn có chắc muốn kết thúc room này? Điểm thi đua sẽ được tính tự động."
      )
    )
      return;
    try {
      const response = await fetch(`/api/games/rooms/${roomId}/end`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Room đã kết thúc. Đã cộng ${
            data.competitionPointsAdded || 0
          } điểm thi đua cho ${data.studentsUpdated || 0} học sinh.`
        );
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (
      !confirm(
        "Bạn có chắc muốn xóa room này? Hành động này không thể hoàn tác!"
      )
    )
      return;
    try {
      const response = await fetch(`/api/games/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      activityType: room.activityType || "snake",
      startDateTime: room.startTime
        ? new Date(room.startTime)
        : getNextQuarterHourDate(),
      endDateTime: room.endTime
        ? new Date(room.endTime)
        : getNextQuarterHourDate(),
      examId: room.examId || "",
    });
    setShowCreateForm(true);
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    try {
      const formatForAPI = (date: Date | undefined) => {
        if (!date) return null;
        return date.toISOString();
      };

      // Calculate duration from startTime and endTime (in minutes)
      let duration = 60; // Default 60 minutes if no endTime
      if (formData.startDateTime && formData.endDateTime) {
        const diffMs =
          formData.endDateTime.getTime() - formData.startDateTime.getTime();
        duration = Math.max(1, Math.floor(diffMs / (1000 * 60))); // Convert to minutes, minimum 1 minute
      }

      // Validate examId if activityType is exam
      if (formData.activityType === "exam" && !formData.examId) {
        alert("Vui lòng chọn đề thi");
        return;
      }

      const response = await fetch(`/api/games/rooms/${editingRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          activityType: formData.activityType,
          startTime: formatForAPI(formData.startDateTime),
          endTime: formatForAPI(formData.endDateTime),
          duration: duration,
          examId:
            formData.activityType === "exam" ? formData.examId : undefined,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setEditingRoom(null);
        setFormData({
          name: "",
          activityType: "snake",
          startDateTime: getNextQuarterHourDate(),
          endDateTime: getNextQuarterHourDate(),
          examId: "",
        });
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.error || "Đã có lỗi xảy ra");
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7]">
        <div className="text-[#2c3e50]">Đang tải...</div>
      </div>
    );
  }

  // Separate rooms into active and ended
  const activeRooms = rooms.filter((room) => !isRoomEnded(room));
  const endedRooms = rooms.filter((room) => isRoomEnded(room));

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2c3e50] mb-4">
            Quản Lý Game Rooms
          </h1>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingRoom(null);
              if (!showCreateForm) {
                setFormData({
                  name: "",
                  activityType: "snake",
                  startDateTime: getNextQuarterHourDate(),
                  endDateTime: getNextQuarterHourDate(),
                  examId: "",
                });
              }
            }}
            className="bg-[#ADC178] text-[#2c3e50] px-6 py-2 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-semibold"
          >
            {showCreateForm ? "Hủy" : "Tạo Room Mới"}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-[#ADC178]">
            <h2 className="text-xl font-bold mb-4 text-[#2c3e50]">
              {editingRoom ? "Chỉnh Sửa Room" : "Tạo Room Mới"}
            </h2>
            <form
              onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                  Tên Room *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
                  placeholder="Room Game 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                  Loại Hoạt Động *
                </label>
                <select
                  value={formData.activityType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      activityType: e.target.value,
                      examId: "",
                    })
                  }
                  className="w-full px-4 py-2 border border-[#ADC178] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A98467]"
                >
                  <option value="snake">Trò chơi con rắn</option>
                  <option value="quiz">Quizz (Sắp có)</option>
                  <option value="exam">Làm bài kiểm tra trực tiếp</option>
                </select>
              </div>
              {formData.activityType === "exam" && (
                <div>
                  <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                    Chọn Đề Thi *
                  </label>
                  <ExamSelector
                    value={formData.examId}
                    onChange={(examId) => setFormData({ ...formData, examId })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                  Thời gian bắt đầu (Tùy chọn)
                </label>
                <DateTimePicker
                  date={formData.startDateTime}
                  onDateChange={(date) =>
                    setFormData({
                      ...formData,
                      startDateTime: date || getNextQuarterHourDate(),
                    })
                  }
                  placeholder="Chọn thời gian bắt đầu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-1">
                  Thời gian kết thúc (Tùy chọn)
                </label>
                <DateTimePicker
                  date={formData.endDateTime}
                  onDateChange={(date) =>
                    setFormData({
                      ...formData,
                      endDateTime: date || getNextQuarterHourDate(),
                    })
                  }
                  placeholder="Chọn thời gian kết thúc"
                />
              </div>
              <button
                type="submit"
                className="bg-[#ADC178] text-[#2c3e50] px-6 py-2 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-semibold"
              >
                {editingRoom ? "Cập Nhật Room" : "Tạo Room"}
              </button>
            </form>
          </div>
        )}

        {/* Active Rooms Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-[#2c3e50]">
            Các Rooms Đang Hoạt Động
          </h2>
          {activeRooms.length === 0 ? (
            <p className="text-[#6C584C]">Chưa có room nào đang hoạt động.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-lg shadow-md p-6 border border-[#ADC178]"
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
                  <p className="text-sm text-[#6C584C] mb-1">
                    Loại:{" "}
                    {room.activityType === "snake"
                      ? "Snake Game"
                      : room.activityType === "exam"
                      ? "Làm bài kiểm tra"
                      : "Quiz"}
                  </p>
                  {room.startTime && room.endTime && (
                    <p className="text-sm text-[#6C584C] mb-1">
                      Thời gian: {room.duration} phút
                    </p>
                  )}
                  {room.startTime && (
                    <p className="text-sm text-[#6C584C] mb-1">
                      Bắt đầu: {formatDateTime(room.startTime)}
                    </p>
                  )}
                  {room.endTime && (
                    <p className="text-sm text-[#6C584C] mb-4">
                      Kết thúc: {formatDateTime(room.endTime)}
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {!hasRoomStarted(room) && (
                        <button
                          onClick={() => handleStartRoom(room.id)}
                          className="flex-1 bg-[#ADC178] text-[#2c3e50] py-2 rounded-lg hover:bg-[#A98467] hover:text-white transition-colors font-semibold"
                        >
                          Bắt Đầu
                        </button>
                      )}
                    </div>
                    {hasRoomStarted(room) && (
                      <Link
                        href={`/teacher/games/${room.id}/leaderboard`}
                        className="w-full bg-[#A98467] text-white text-center py-2 rounded-lg hover:bg-[#6C584C] font-bold"
                      >
                        🏆 Xem Bảng Xếp Hạng
                      </Link>
                    )}
                    <div className="flex gap-2 mt-2">
                      {hasRoomStarted(room) && (
                        <button
                          onClick={() => handleEndRoom(room.id)}
                          className="flex-1 bg-[#D2691E] text-white py-2 rounded-lg hover:bg-[#A0522D] text-sm font-semibold"
                        >
                          Kết Thúc
                        </button>
                      )}
                      {!hasRoomStarted(room) && (
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="flex-1 bg-[#DFC273] text-[#2c3e50] py-2 rounded-lg hover:bg-[#D4A047] text-sm font-semibold"
                        >
                          Chỉnh Sửa
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="flex-1 bg-[#711E19] text-white py-2 rounded-lg hover:bg-[#5A1612] text-sm font-semibold"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ended Rooms Section */}
        <div>
          <button
            onClick={() => setShowEndedRooms(!showEndedRooms)}
            className="flex items-center gap-2 text-xl font-bold mb-4 text-[#2c3e50] hover:text-[#A98467] transition-colors"
          >
            <span>{showEndedRooms ? "▼" : "▶"}</span>
            <span>Các Rooms Đã Hết Hoạt Động ({endedRooms.length})</span>
          </button>
          {showEndedRooms && (
            <>
              {endedRooms.length === 0 ? (
                <p className="text-[#6C584C]">Chưa có room nào đã kết thúc.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {endedRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-[#EFEBDF] rounded-lg shadow-md p-6 border border-[#ADC178] opacity-75"
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
                      <p className="text-sm text-[#6C584C] mb-1">
                        Loại:{" "}
                        {room.activityType === "snake"
                          ? "Snake Game"
                          : room.activityType === "exam"
                          ? "Làm bài kiểm tra"
                          : "Quiz"}
                      </p>
                      {room.startTime && room.endTime && (
                        <p className="text-sm text-[#6C584C] mb-1">
                          Thời gian: {room.duration} phút
                        </p>
                      )}
                      {room.startTime && (
                        <p className="text-sm text-[#6C584C] mb-1">
                          Bắt đầu: {formatDateTime(room.startTime)}
                        </p>
                      )}
                      {room.endTime && (
                        <p className="text-sm text-[#6C584C] mb-4">
                          Kết thúc: {formatDateTime(room.endTime)}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Link
                          href={`/teacher/games/${room.id}/leaderboard`}
                          className="flex-1 bg-[#6C584C] text-white text-center py-2 rounded-lg hover:bg-[#5A1612] font-semibold"
                        >
                          Xem
                        </Link>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="flex-1 bg-[#711E19] text-white py-2 rounded-lg hover:bg-[#5A1612] font-semibold"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
