"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

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
            width={100}
            height={100}
          />
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex space-x-8 justify-center items-center">
          {/* Only show these menus when not logged in as teacher */}
          {!user || user.role !== "teacher" ? (
            <>
              {/* Liên hệ */}
              <Link
                href="/student/calendar"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Lịch học
              </Link>
              {user && user.role === "student" && (
                <>
                  <Link
                    href="/student/documents"
                    className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
                  >
                    Tài liệu
                  </Link>
                  <Link
                    href="/student/exams"
                    className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
                  >
                    Luyện đề
                  </Link>
                </>
              )}
              <Link
                href="/rules"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Nội quy
              </Link>
              <Link
                href="/contact"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Liên hệ
              </Link>
            </>
          ) : null}

          {/* Teacher menu when logged in */}
          {user && user.role === "teacher" && (
            <div className="relative group">
              <button className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50] flex items-center">
                Quản lý
                <svg
                  className="ml-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#EFEBDF] border border-[#FACE84] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link
                    href="/teacher/calendar"
                    className="block px-4 py-2 text-sm text-[#654321] hover:bg-[#D4A047]/10 hover:text-[#D4A047] transition-colors"
                  >
                    Lịch dạy
                  </Link>
                  <Link
                    href="/teacher/overview"
                    className="block px-4 py-2 text-sm text-[#654321] hover:bg-[#D4A047]/10 hover:text-[#D4A047] transition-colors"
                  >
                    Tiến độ học viên
                  </Link>
                  <Link
                    href="/teacher/students"
                    className="block px-4 py-2 text-sm text-[#654321] hover:bg-[#D4A047]/10 hover:text-[#D4A047] transition-colors"
                  >
                    Danh sách học viên
                  </Link>
                  <Link
                    href="/teacher/classes"
                    className="block px-4 py-2 text-sm text-[#654321] hover:bg-[#D4A047]/10 hover:text-[#D4A047] transition-colors"
                  >
                    Quản lý lớp học
                  </Link>
                  <Link
                    href="/teacher/documents"
                    className="block px-4 py-2 text-sm text-[#654321] hover:bg-[#D4A047]/10 hover:text-[#D4A047] transition-colors"
                  >
                    Quản lý tài liệu
                  </Link>
                  <Link
                    href="/teacher/exams"
                    className="block px-4 py-2 text-sm text-[#654321] hover:bg-[#D4A047]/10 hover:text-[#D4A047] transition-colors"
                  >
                    Quản lý đề
                  </Link>
                </div>
              </div>
            </div>
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
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-2xl font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#EFEBDF] border-t border-[#FACE84] shadow-lg z-50">
          <div className="px-6 py-4 space-y-4">
            {/* Only show these menus when not logged in as teacher */}
            {!user || user.role !== "teacher" ? (
              <>
                <Link
                  href="/student/calendar"
                  className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Lịch học
                </Link>
                {user && user.role === "student" && (
                  <>
                    <Link
                      href="/student/documents"
                      className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Tài liệu
                    </Link>
                    <Link
                      href="/student/exams"
                      className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Luyện đề
                    </Link>
                  </>
                )}
                <Link
                  href="/rules"
                  className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Nội quy
                </Link>
                <Link
                  href="/contact"
                  className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Liên hệ
                </Link>
              </>
            ) : null}

            {/* Giáo viên / Quản lý */}
            {!user || user.role !== "teacher" ? (
              <div>
                <div className="text-lg font-semibold text-[#2c3e50] mb-3">
                  Giáo viên
                </div>
                <div className="pl-4 space-y-1">
                  <Link
                    href="/teacher/dashboard"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Bảng điều khiển
                  </Link>
                  <Link
                    href="/teacher/attendance"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Điểm danh học viên
                  </Link>
                  <Link
                    href="/teacher/classes"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý lớp học
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-semibold text-[#2c3e50] mb-3">
                  Quản lý
                </div>
                <div className="pl-4 space-y-1">
                  <Link
                    href="/teacher/calendar"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Lịch dạy
                  </Link>
                  <Link
                    href="/teacher/overview"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tiến độ học viên
                  </Link>
                  <Link
                    href="/teacher/students"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Danh sách học viên
                  </Link>
                  <Link
                    href="/teacher/classes"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý lớp học
                  </Link>
                  <Link
                    href="/teacher/documents"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý tài liệu
                  </Link>
                  <Link
                    href="/teacher/exams"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý đề
                  </Link>
                </div>
              </div>
            )}

            {/* User info / Login - Mobile */}
            {!loading && (
              <div className="pt-4 border-t border-[#FACE84]">
                {user ? (
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
                ) : (
                  <Link
                    href="/sign-in"
                    className="block w-full text-center px-4 py-2 rounded text-lg font-medium transition-colors"
                    style={{
                      backgroundColor: "#ADC178",
                      color: "white",
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
