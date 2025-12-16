"use client";

import Image from "next/image";
import Link from "next/link";
import { Course } from "../data/courses";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "online"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-[#FACE84]">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={course.image}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(
              course.type
            )}`}
          >
            {course.type === "online" ? "Online" : "Offline"}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(
              course.level
            )}`}
          >
            {course.level === "basic"
              ? "Cơ bản"
              : course.level === "intermediate"
              ? "Trung bình"
              : "Nâng cao"}
          </span>
        </div>
        {course.originalPrice && (
          <div className="absolute top-4 right-4 bg-[#D4A047] text-white px-2 py-1 rounded-lg text-sm font-bold">
            -{Math.round((1 - course.price / course.originalPrice) * 100)}%
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-[#2c3e50] mb-2 line-clamp-2 group-hover:text-[#D4A047] transition-colors">
          <Link href={`/courses/${course.id}`}>{course.title}</Link>
        </h3>

        {/* Instructor */}
        <p className="text-[#654321] text-sm mb-3">
          Giảng viên: <span className="font-semibold">{course.instructor}</span>
        </p>

        {/* Description */}
        <p className="text-[#654321] text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {course.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="bg-[#F8F9FA] text-[#654321] text-xs px-2 py-1 rounded-full"
              >
                {feature}
              </span>
            ))}
            {course.features.length > 3 && (
              <span className="text-[#654321] text-xs px-2 py-1">
                +{course.features.length - 3} khác
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm text-[#654321]">
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-semibold">{course.rating}</span>
            <span>({course.students} học viên)</span>
          </div>
          <span className="font-semibold">{course.duration}</span>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-[#D4A047]">
              {formatPrice(course.price)}
            </div>
            {course.originalPrice && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(course.originalPrice)}
              </div>
            )}
          </div>
          <Link
            href={`/courses/${course.id}`}
            className="bg-[#D4A047] hover:bg-[#B8860B] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}
