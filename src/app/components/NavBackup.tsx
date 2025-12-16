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
              {/* Về chúng tôi */}
              <Link
                href="/about"
                className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50]"
              >
                Về chúng tôi
              </Link>
              {/* Sản phẩm */}
              <div className="relative group">
                <Link
                  href="/products"
                  className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50] flex items-center"
                >
                  Sản phẩm
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <div className="absolute top-[47px] left-[-250px] mt-1 w-[550px] bg-[#EFEBDF] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-8 py-6 bg-[#EFEBDF] border border-[#D4A047] rounded-lg shadow-2xl relative">
                    {/* Vintage paper texture overlay */}
                    <div
                      className="absolute inset-0 opacity-30 rounded-lg"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A047' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      }}
                    ></div>

                    <div className="relative grid grid-cols-3 gap-8">
                      {/* Column 1 - Đàn guitar */}
                      <div>
                        <div className="text-lg font-sans font-bold text-[#8B4513] mb-4 border-b-2 border-[#D4A047] pb-2">
                          Đàn guitar
                        </div>
                        <div className="space-y-3">
                          <Link
                            href="/products?category=guitar&subcategory=electric"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Guitar điện
                          </Link>
                          <Link
                            href="/products?category=guitar&subcategory=acoustic"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Guitar thùng
                          </Link>
                          <Link
                            href="/products?category=guitar&isNew=false"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Guitar 2 hand
                          </Link>
                        </div>
                      </div>

                      {/* Column 2 - Amply */}
                      <div>
                        <div className="text-lg font-sans font-bold text-[#8B4513] mb-4 border-b-2 border-[#D4A047] pb-2">
                          Amply
                        </div>
                        <div className="space-y-3">
                          <Link
                            href="/products?category=amplifier&isNew=true"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Amply mới
                          </Link>
                          <Link
                            href="/products?category=amplifier&isNew=false"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Amply cũ
                          </Link>
                        </div>
                      </div>

                      {/* Column 3 - Phụ kiện */}
                      <div>
                        <div className="text-lg font-sans font-bold text-[#8B4513] mb-4 border-b-2 border-[#D4A047] pb-2">
                          Phụ kiện
                        </div>
                        <div className="space-y-3">
                          <Link
                            href="/products?category=accessories&subcategory=cases"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Bao đàn
                          </Link>
                          <Link
                            href="/products?category=accessories&subcategory=strings"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Dây đàn
                          </Link>
                          <Link
                            href="/products?category=accessories&subcategory=capos"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Capo
                          </Link>
                          <Link
                            href="/products?category=accessories&subcategory=picks"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Pick
                          </Link>
                          <Link
                            href="/products?category=accessories&subcategory=straps"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Dây đeo
                          </Link>
                          <Link
                            href="/products?category=accessories&subcategory=lines"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Dây line
                          </Link>
                          <Link
                            href="/products?category=accessories"
                            className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                          >
                            Tất cả phụ kiện
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Khóa học */}
              <div className="relative group">
                <Link
                  href="/courses"
                  className="hover:text-[#D4A047] text-lg transition-colors font-sans font-semibold text-[#2c3e50] flex items-center"
                >
                  Khóa học
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <div className="absolute top-[47px] left-[-100px] mt-1 w-[300px] bg-[#EFEBDF] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-8 py-6 bg-[#EFEBDF] border border-[#D4A047] rounded-lg shadow-2xl relative">
                    {/* Vintage paper texture overlay */}
                    <div
                      className="absolute inset-0 opacity-30 rounded-lg"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A047' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      }}
                    ></div>

                    <div className="relative">
                      <div className="text-lg font-sans font-bold text-[#8B4513] mb-4 border-b-2 border-[#D4A047] pb-2">
                        Khóa học guitar
                      </div>
                      <div className="space-y-3">
                        <Link
                          href="/courses?type=online"
                          className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                        >
                          Khóa học online
                        </Link>
                        <Link
                          href="/courses?type=offline"
                          className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                        >
                          Khóa học offline
                        </Link>
                        <Link
                          href="/courses"
                          className="block text-sm font-sans font-semibold text-[#654321] hover:text-[#8B4513] hover:underline transition-all duration-200 pl-2 border-l-2 border-transparent hover:border-[#D4A047]"
                        >
                          Tất cả khóa học
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liên hệ */}
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
                    Quản lý lịch học
                  </Link>
                  <Link
                    href="/teacher/overview"
                    className="block px-4 py-2 text-sm text-[#654321] hover:bg-[#D4A047]/10 hover:text-[#D4A047] transition-colors"
                  >
                    Tổng quan học viên
                  </Link>
                  <Link
                    href="/teacher/students"
                    className="block px-4 py-2 text-sm text-[#654321] hover:bg-[#D4A047]/10 hover:text-[#D4A047] transition-colors"
                  >
                    Quản lý học viên
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
                {/* Về chúng tôi */}
                <Link
                  href="/about"
                  className="block text-lg font-semibold text-[#2c3e50] hover:text-[#D4A047] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Về chúng tôi
                </Link>

                {/* Sản phẩm */}
                <div>
                  <div className="text-lg font-semibold text-[#2c3e50] mb-3">
                    Sản phẩm
                  </div>
                  <div className="pl-4 space-y-2">
                    <div className="text-sm font-semibold text-[#8B4513] mb-2">
                      Đàn guitar
                    </div>
                    <div className="pl-2 space-y-1">
                      <Link
                        href="/products?category=guitar&subcategory=electric"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Guitar điện
                      </Link>
                      <Link
                        href="/products?category=guitar&subcategory=acoustic"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Guitar thùng
                      </Link>
                      <Link
                        href="/products?category=guitar&isNew=true"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Guitar 2 hand
                      </Link>
                    </div>

                    <div className="text-sm font-semibold text-[#8B4513] mb-2 mt-3">
                      Ampli
                    </div>
                    <div className="pl-2 space-y-1">
                      <Link
                        href="/products?category=amplifier&isNew=true"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Amply mới
                      </Link>
                      <Link
                        href="/products?category=amplifier&isNew=false"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Amply cũ
                      </Link>
                    </div>

                    <div className="text-sm font-semibold text-[#8B4513] mb-2 mt-3">
                      Phụ kiện
                    </div>
                    <div className="pl-2 space-y-1">
                      <Link
                        href="/products?category=accessories&subcategory=cases"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Bao đàn
                      </Link>
                      <Link
                        href="/products?category=accessories&subcategory=strings"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dây đàn
                      </Link>
                      <Link
                        href="/products?category=accessories&subcategory=capos"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Capo
                      </Link>
                      <Link
                        href="/products?category=accessories&subcategory=picks"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Pick
                      </Link>
                      <Link
                        href="/products?category=accessories&subcategory=straps"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dây đeo
                      </Link>
                      <Link
                        href="/products?category=accessories&subcategory=lines"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dây line
                      </Link>
                      <Link
                        href="/products?category=accessories"
                        className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Tất cả phụ kiện
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Khóa học */}
                <div>
                  <div className="text-lg font-semibold text-[#2c3e50] mb-3">
                    Khóa học
                  </div>
                  <div className="pl-4 space-y-1">
                    <Link
                      href="/courses"
                      className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Tất cả khóa học
                    </Link>
                    <Link
                      href="/courses?type=online"
                      className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Khóa học online
                    </Link>
                    <Link
                      href="/courses?type=offline"
                      className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Khóa học offline
                    </Link>
                  </div>
                </div>

                {/* Học sinh */}
                <div>
                  <div className="text-lg font-semibold text-[#2c3e50] mb-3">
                    Học viên
                  </div>
                  <div className="pl-4 space-y-1">
                    <Link
                      href="/student/auth"
                      className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Đăng nhập/Đăng ký
                    </Link>
                    <Link
                      href="/student/register-course"
                      className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Đăng ký khóa học
                    </Link>
                    <Link
                      href="/student/schedule"
                      className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Lịch học của tôi
                    </Link>
                  </div>
                </div>

                {/* Liên hệ */}
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
                    Quản lý lịch học
                  </Link>
                  <Link
                    href="/teacher/overview"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tổng quan học viên
                  </Link>
                  <Link
                    href="/teacher/students"
                    className="block text-sm text-[#654321] hover:text-[#8B4513] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Quản lý học viên
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
