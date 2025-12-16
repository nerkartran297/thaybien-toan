"use client";

import Image from "next/image";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { courses } from "../../data/courses";
import { useState, useEffect } from "react";

export default function CoursesPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
      <Navigation />

      {/* Hero Section with Animation */}
      <div className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 h-[95vh]">
          <Image
            src="/wallpaper-3.jpg"
            alt="Courses Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <h1 className="text-7xl font-bold text-white mb-6 drop-shadow-2xl animate-pulse">
              Khóa Học Guitar
            </h1>
            <p className="text-2xl text-white/90 drop-shadow-lg mb-8">
              Học guitar từ cơ bản đến nâng cao với Phúc Nguyễn
            </p>
            <div className="flex justify-center gap-4">
              <div className="w-2 h-2 bg-[#D4A047] rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-[#D4A047] rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-[#D4A047] rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-20 pt-10">
        {/* Courses Grid - Flexible Height */}
        <div className="grid lg:grid-cols-2 gap-16 mb-20">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className={`group relative transform transition-all duration-700 hover:scale-105 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-20 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              {/* Card Container - Flexible Height */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#FACE84] hover:shadow-3xl transition-all duration-500">
                {/* Course Image - Fixed Height */}
                <div
                  className="relative h-80 overflow-hidden"
                  onMouseEnter={() => {
                    setHoveredCard(course.id);
                    setPlayingVideo(course.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredCard(null);
                    setPlayingVideo(null);
                  }}
                >
                  {/* Video Background */}
                  {playingVideo === course.id && (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      loop
                      playsInline
                    >
                      <source
                        src="/video/courses/basic.mov"
                        type="video/quicktime"
                      />
                      <source src="/video/courses/basic.mov" type="video/mp4" />
                    </video>
                  )}

                  {/* Image Fallback */}
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    className={`object-cover transition-all duration-700 ${
                      playingVideo === course.id
                        ? "opacity-0 scale-110"
                        : hoveredCard === course.id
                        ? "opacity-100 scale-110"
                        : "opacity-100 scale-100"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Floating badges */}
                  <div
                    className={`absolute top-6 left-6 flex gap-2 transition-opacity duration-300 ${
                      playingVideo === course.id ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm ${
                        course.type === "online"
                          ? "bg-blue-500/90 text-white"
                          : "bg-purple-500/90 text-white"
                      }`}
                    >
                      {course.type === "online" ? "Online" : "Offline"}
                    </span>
                    <span className="bg-[#D4A047]/90 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm">
                      -
                      {Math.round(
                        (1 - course.price / course.originalPrice!) * 100
                      )}
                      %
                    </span>
                  </div>

                  {/* Course title overlay */}
                  <div
                    className={`absolute bottom-6 left-6 right-6 transition-opacity duration-300 ${
                      playingVideo === course.id ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                      {course.title}
                    </h2>
                    <p className="text-white/90 text-sm">
                      {course.instructor} • {course.duration}
                    </p>
                  </div>
                </div>

                {/* Course Content - Flexible Height */}
                <div className="p-8">
                  {/* Header with Rating and Price */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-5 h-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-bold text-lg">
                          {course.rating}
                        </span>
                        <span className="text-gray-600">
                          ({course.students} học viên)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#D4A047]">
                        {formatPrice(course.price)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(course.originalPrice!)}
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="mb-8">
                    <h4 className="font-bold text-[#2c3e50] mb-4 text-lg">
                      Thông tin khóa học
                    </h4>
                    <p className="text-[#654321] leading-relaxed text-base">
                      {course.description}
                    </p>
                  </div>

                  {/* What You'll Learn Section */}
                  <div className="mb-8">
                    <h4 className="font-bold text-[#2c3e50] mb-4 text-lg flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Bạn sẽ học được
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.whatYouWillLearn.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-[#D4A047] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-[#654321]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={`/courses/${course.id}`}
                    className="block w-full bg-gradient-to-r from-[#D4A047] to-[#B8860B] hover:from-[#B8860B] hover:to-[#D4A047] text-white text-center py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    Xem Chi Tiết Khóa Học
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructors Section */}
        <div
          className={`transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <h2 className="text-5xl font-bold text-[#2c3e50] text-center mb-16">
            Giảng Viên Của Chúng Tôi
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#D4A047] to-[#B8860B] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Image
                        src={(course.instructorInfo as { image?: string }).image || '/default-instructor.png'}
                        alt={course.instructorInfo.name}
                        width={80}
                        height={80}
                        className="rounded-full"
                      />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#D4A047] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">★</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[#2c3e50] mb-2 group-hover:text-[#D4A047] transition-colors">
                      {course.instructorInfo.name}
                    </h3>
                    <p className="text-[#D4A047] font-bold mb-4 text-lg">
                      {course.instructorInfo.experience} kinh nghiệm
                    </p>
                    <p className="text-[#654321] mb-6 leading-relaxed">
                      {course.instructorInfo.bio}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {course.instructorInfo.specialties.map(
                        (specialty, idx) => (
                          <span
                            key={idx}
                            className="bg-gradient-to-r from-[#D4A047] to-[#B8860B] text-white text-sm px-3 py-1 rounded-full font-semibold hover:scale-105 transition-transform duration-200"
                          >
                            {specialty}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div
          className={`mt-20 transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <div className="bg-gradient-to-r from-[#D4A047] to-[#B8860B] p-16 rounded-3xl text-center text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">
                Sẵn Sàng Bắt Đầu Hành Trình Âm Nhạc?
              </h2>
              <p className="text-xl mb-10 text-white/90">
                Chọn khóa học phù hợp với trình độ và nhu cầu của bạn
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href={`/courses/${courses[0].id}`}
                  className="px-10 py-4 bg-white text-[#D4A047] rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Khóa Học Online
                </Link>
                <Link
                  href={`/courses/${courses[1].id}`}
                  className="px-10 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-[#D4A047] transition-all duration-300 transform hover:scale-105"
                >
                  Khóa Học Offline
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
