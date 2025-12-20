"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExam } from "@/contexts/ExamContext";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, logout, loading } = useAuth();
  const { isExamInProgress } = useExam();

  // Prevent hydration mismatch by only checking exam status after mount
  // On server, examInProgress will always be false
  const examInProgress = mounted ? isExamInProgress() : false;

  // Prevent hydration mismatch by only rendering client-specific content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 flex justify-between items-center px-8 py-2 border-b bg-[#EFEBDF] border-[#FACE84] z-40">
      {/* Logo */}
      <div className="flex items-center md:ml-8">
        <Link
          href="/"
          className="hover:text-[#D4A047] transition-colors font-sans font-semibold text-[#2c3e50]"
        >
          <Image
            src="/logo-bw-100.png"
            alt="Phuc Nguyen Guitar Logo"
            width={200}
            height={200}
          />
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex space-x-4 xl:space-x-6 justify-center items-center">
          {/* Only show these menus when not logged in as teacher */}
          {!user || user.role !== "teacher" ? (
            <>
              {examInProgress ? (
                <span
                  className="text-lg font-sans font-semibold text-gray-400 cursor-not-allowed"
                  title="Đang làm bài thi, không thể chuyển trang"
                >
                  Lịch học
                </span>
              ) : (
                <Link
                  href="/student/calendar"
                  className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
                >
                  Lịch học
                </Link>
              )}
              {user && user.role === "student" && (
                <>
                  {examInProgress ? (
                    <span
                      className="text-lg font-sans font-semibold text-gray-400 cursor-not-allowed"
                      title="Đang làm bài thi, không thể chuyển trang"
                    >
                      Tài liệu
                    </span>
                  ) : (
                    <Link
                      href="/student/documents"
                      className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
                    >
                      Tài liệu
                    </Link>
                  )}
                  {examInProgress ? (
                    <span
                      className="text-lg font-sans font-semibold text-gray-400 cursor-not-allowed"
                      title="Đang làm bài thi, không thể chuyển trang"
                    >
                      Luyện đề
                    </span>
                  ) : (
                    <Link
                      href="/student/exams"
                      className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
                    >
                      Luyện đề
                    </Link>
                  )}
                  {examInProgress ? (
                    <span
                      className="text-lg font-sans font-semibold text-gray-400 cursor-not-allowed"
                      title="Đang làm bài thi, không thể chuyển trang"
                    >
                      Hoạt động
                    </span>
                  ) : (
                    <Link
                      href="/student/games"
                      className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
                    >
                      Hoạt động
                    </Link>
                  )}
                  {examInProgress ? (
                    <span
                      className="text-lg font-sans font-semibold text-gray-400 cursor-not-allowed"
                      title="Đang làm bài thi, không thể chuyển trang"
                    >
                      Bảng Xếp Hạng
                    </span>
                  ) : (
                    <Link
                      href="/student/leaderboard"
                      className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
                    >
                      Bảng Xếp Hạng
                    </Link>
                  )}
                </>
              )}
              {examInProgress ? (
                <span
                  className="text-lg font-sans font-semibold text-gray-400 cursor-not-allowed"
                  title="Đang làm bài thi, không thể chuyển trang"
                >
                  Nội quy
                </span>
              ) : (
                <Link
                  href="/rules"
                  className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
                >
                  Nội quy
                </Link>
              )}
            </>
          ) : null}

          {/* Teacher menu when logged in */}
          {user && user.role === "teacher" && (
            <>
              <Link
                href="/teacher/calendar"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Lịch dạy
              </Link>
              <Link
                href="/teacher/overview"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Tiến độ học viên
              </Link>
              <Link
                href="/teacher/students"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Học viên
              </Link>
              <Link
                href="/teacher/classes"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Lớp học
              </Link>
              <Link
                href="/teacher/documents"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Tài liệu
              </Link>
              <Link
                href="/teacher/exams"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Đề thi
              </Link>
              <Link
                href="/teacher/quizzes"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Quiz
              </Link>
              <Link
                href="/teacher/games"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Hoạt động
              </Link>
              <Link
                href="/teacher/leaderboard"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Bảng Xếp Hạng
              </Link>
            </>
          )}

          {/* User info / Login */}
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-sm" style={{ color: "#654321" }}>
                    <span className="font-semibold">{user.fullName}</span>
                    <span className="ml-2 text-xs">
                      ({user.role === "teacher" ? "Giáo viên" : "Học viên"})
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1 rounded text-lg  font-medium transition-colors"
                    style={{
                      backgroundColor: "#A98467",
                      color: "white",
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="px-4 rounded text-lg py-1 font-medium transition-colors"
                  style={{
                    backgroundColor: "#ADC178",
                    color: "white",
                  }}
                >
                  Đăng nhập
                </Link>
              )}
            </>
          )}
        </div>
      </div>
      {/* Mobile menu button and login button */}
      <div className="lg:hidden flex items-center gap-3">
        {/* User info / Login - Mobile (always visible) */}
        {!loading && (
          <>
            {user ? (
              <>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-2xl font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                >
                  {isMobileMenuOpen ? "✕" : "☰"}
                </button>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="px-3 py-1 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "#ADC178",
                  color: "white",
                }}
              >
                Đăng nhập
              </Link>
            )}
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#EFEBDF] border-t border-[#FACE84] shadow-lg z-50">
          <div className="px-6 py-4 space-y-4">
            {/* Only show these menus when logged in and not teacher */}
            {user && user.role !== "teacher" ? (
              <>
                {examInProgress ? (
                  <span
                    className="block text-lg font-semibold text-gray-400 cursor-not-allowed"
                    title="Đang làm bài thi, không thể chuyển trang"
                  >
                    Lịch học
                  </span>
                ) : (
                  <Link
                    href="/student/calendar"
                    className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Lịch học
                  </Link>
                )}
                {user && user.role === "student" && (
                  <>
                    {examInProgress ? (
                      <span
                        className="block text-lg font-semibold text-gray-400 cursor-not-allowed"
                        title="Đang làm bài thi, không thể chuyển trang"
                      >
                        Tài liệu
                      </span>
                    ) : (
                      <Link
                        href="/student/documents"
                        className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Tài liệu
                      </Link>
                    )}
                    {examInProgress ? (
                      <span
                        className="block text-lg font-semibold text-gray-400 cursor-not-allowed"
                        title="Đang làm bài thi, không thể chuyển trang"
                      >
                        Luyện đề
                      </span>
                    ) : (
                      <Link
                        href="/student/exams"
                        className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Luyện đề
                      </Link>
                    )}
                    {examInProgress ? (
                      <span
                        className="block text-lg font-semibold text-gray-400 cursor-not-allowed"
                        title="Đang làm bài thi, không thể chuyển trang"
                      >
                        Hoạt động
                      </span>
                    ) : (
                      <Link
                        href="/student/games"
                        className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Hoạt động
                      </Link>
                    )}
                    {examInProgress ? (
                      <span
                        className="block text-lg font-semibold text-gray-400 cursor-not-allowed"
                        title="Đang làm bài thi, không thể chuyển trang"
                      >
                        Bảng Xếp Hạng
                      </span>
                    ) : (
                      <Link
                        href="/student/leaderboard"
                        className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Bảng Xếp Hạng
                      </Link>
                    )}
                  </>
                )}
                {examInProgress ? (
                  <span
                    className="block text-lg font-semibold text-gray-400 cursor-not-allowed"
                    title="Đang làm bài thi, không thể chuyển trang"
                  >
                    Nội quy
                  </span>
                ) : (
                  <Link
                    href="/rules"
                    className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Nội quy
                  </Link>
                )}
              </>
            ) : null}

            {/* Teacher menu when logged in */}
            {user && user.role === "teacher" && (
              <div>
                <div className="text-lg font-semibold text-[#2c3e50] mb-3">
                  Quản lý
                </div>
                <div className="pl-4 space-y-1">
                  <Link
                    href="/teacher/calendar"
                    className="block text-sm text-[#654321] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Lịch dạy
                  </Link>
                  <Link
                    href="/teacher/overview"
                    className="block text-sm text-[#654321] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tiến độ học viên
                  </Link>
                  <Link
                    href="/teacher/students"
                    className="block text-sm text-[#654321] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Danh sách học viên
                  </Link>
                  <Link
                    href="/teacher/classes"
                    className="block text-sm text-[#654321] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý lớp học
                  </Link>
                  <Link
                    href="/teacher/documents"
                    className="block text-sm text-[#654321] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý tài liệu
                  </Link>
                  <Link
                    href="/teacher/exams"
                    className="block text-sm text-[#654321] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý đề
                  </Link>
                  <Link
                    href="/teacher/quizzes"
                    className="block text-sm text-[#654321] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý Quiz
                  </Link>
                  <Link
                    href="/teacher/games"
                    className="block text-sm text-[#654321] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Hoạt động
                  </Link>
                  <Link
                    href="/teacher/leaderboard"
                    className="block text-sm text-[#654321] hover:text-[#D4A047] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Bảng Xếp Hạng
                  </Link>
                </div>
              </div>
            )}

            {/* User info / Logout - Mobile */}
            {!loading && user && (
              <div className="pt-4 border-t border-[#FACE84]">
                <div className="space-y-3">
                  <div className="text-sm" style={{ color: "#654321" }}>
                    <div className="font-semibold">{user.fullName}</div>
                    <div className="text-xs mt-1">
                      {user.role === "teacher" ? "Giáo viên" : "Học viên"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 rounded text-lg font-medium transition-colors"
                    style={{
                      backgroundColor: "#A98467",
                      color: "white",
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
