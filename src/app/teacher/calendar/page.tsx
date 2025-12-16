"use client";

import React, { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import WeekCalendar from "@/app/components/WeekCalendar";
import CreateClassModal from "@/app/components/CreateClassModal";
import { Class, CreateClassData } from "@/models/Class";

export default function TeacherCalendarPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<
    Array<{
      sessionDate: Date;
      studentId?: string;
      classId?: string;
      status?: string;
    }>
  >([]);
  const [makeupRequests, setMakeupRequests] = useState<
    Array<{
      newClassId?: string;
      newSessionDate: Date;
      status?: string;
    }>
  >([]);

  // Fetch classes
  useEffect(() => {
    fetchClasses();
    fetchAbsenceAndMakeupRequests();
  }, []);

  const fetchAbsenceAndMakeupRequests = async () => {
    try {
      // No need to fetch absence requests anymore
      // Fetch attendance records with status "excused" instead
      const attendanceResponse = await fetch("/api/attendance");
      if (attendanceResponse.ok) {
        const attendance = await attendanceResponse.json();
        // Filter only excused absences and format for WeekCalendar
        const excusedAttendances = attendance
          .filter((att: { status?: string }) => att.status === "excused")
          .map(
            (att: {
              sessionDate: Date | string;
              studentId?: { toString: () => string } | string;
              classId?: { toString: () => string } | string;
              status?: string;
            }) => ({
              sessionDate: new Date(att.sessionDate),
              studentId: att.studentId?.toString(),
              classId: att.classId?.toString(),
              status: att.status,
            })
          );
        setAttendanceRecords(excusedAttendances);
      }

      // Fetch all makeup requests
      const makeupsResponse = await fetch("/api/makeups");
      if (makeupsResponse.ok) {
        const makeups = await makeupsResponse.json();
        setMakeupRequests(makeups);
      }
    } catch (error) {
      console.error("Error fetching absence and makeup requests:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes?isActive=true");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateClass = async (data: CreateClassData) => {
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        await fetchClasses();
        setShowCreateModal(false);
        alert("Tạo lớp học thành công!");
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating class:", error);
      alert("Có lỗi xảy ra khi tạo lớp học");
    }
  };

  const handleEditClass = (classId: string) => {
    const classToEdit = classes.find((cls) => cls._id?.toString() === classId);
    if (classToEdit) {
      setEditingClass(classToEdit);
      setShowCreateModal(true);
    }
  };

  const handleUpdateClass = async (data: CreateClassData) => {
    if (!editingClass?._id) return;

    try {
      const response = await fetch(`/api/classes/${editingClass._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchClasses();
        setShowCreateModal(false);
        setEditingClass(null);
        alert("Cập nhật lớp học thành công!");
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating class:", error);
      alert("Có lỗi xảy ra khi cập nhật lớp học");
    }
  };

  const handleCancelClass = async (classId: string, date: Date) => {
    try {
      const response = await fetch(`/api/classes/${classId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: date.toISOString() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel class");
      }

      alert(
        `Đã hủy lớp học vào ${date.toLocaleDateString(
          "vi-VN"
        )}. Học viên sẽ được cộng buổi học bù.`
      );
      await fetchClasses();
    } catch (error) {
      console.error("Error canceling class:", error);
      alert("Có lỗi xảy ra khi hủy lớp học");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--page-background)" }}
      >
        <div className="text-lg" style={{ color: "#6C584C" }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--page-background)" }}
    >
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <WeekCalendar
          role="teacher"
          classes={classes}
          onCancelClass={handleCancelClass}
          onCreateClass={() => {
            setEditingClass(null);
            setShowCreateModal(true);
          }}
          onEditClass={handleEditClass}
          attendanceRecords={attendanceRecords.map(
            (a: {
              classId?: string;
              sessionDate: Date | string;
              studentId?: string;
              status?: string;
            }) => ({
              classId: a.classId?.toString(),
              sessionDate: new Date(a.sessionDate),
              studentId: a.studentId?.toString(),
              status: a.status || "approved", // Default to 'approved' if not set
            })
          )}
          makeupRequests={makeupRequests.map(
            (m: {
              newClassId?: { toString: () => string } | string;
              newSessionDate: Date | string;
            }) => ({
              newClassId: m.newClassId?.toString(),
              newSessionDate: new Date(m.newSessionDate),
            })
          )}
        />

        {showCreateModal && (
          <CreateClassModal
            onClose={() => {
              setShowCreateModal(false);
              setEditingClass(null);
            }}
            onSubmit={editingClass ? handleUpdateClass : handleCreateClass}
            initialData={
              editingClass
                ? {
                    name: editingClass.name,
                    grade: editingClass.grade,
                    sessions: editingClass.sessions,
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
