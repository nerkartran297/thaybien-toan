"use client";

import { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Document, DocumentCategory } from "@/models/Document";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

const CATEGORIES: DocumentCategory[] = ["Bài tập", "Đề giữa kỳ", "Đề cuối kỳ"];

export default function StudentDocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "Tất cả">("Tất cả");
  const [selectedGrade, setSelectedGrade] = useState<number | "Tất cả">("Tất cả");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents?role=student");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (selectedCategory !== "Tất cả" && doc.category !== selectedCategory) {
      return false;
    }
    if (selectedGrade !== "Tất cả" && doc.grade !== selectedGrade) {
      return false;
    }
    return true;
  });

  if (authLoading || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.light }}
      >
        <div className="text-lg" style={{ color: colors.darkBrown }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: colors.darkBrown }}
          >
            Kho Tài Liệu
          </h1>
          <p className="text-lg" style={{ color: colors.brown }}>
            Tài liệu học tập của bạn
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.darkBrown }}
              >
                Phân loại
              </label>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value as DocumentCategory | "Tất cả"
                  )
                }
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: colors.brown,
                  color: colors.darkBrown,
                }}
              >
                <option value="Tất cả">Tất cả</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: colors.darkBrown }}
              >
                Khối
              </label>
              <select
                value={selectedGrade}
                onChange={(e) =>
                  setSelectedGrade(
                    e.target.value === "Tất cả"
                      ? "Tất cả"
                      : parseInt(e.target.value)
                  )
                }
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: colors.brown,
                  color: colors.darkBrown,
                }}
              >
                <option value="Tất cả">Tất cả</option>
                {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <option key={grade} value={grade}>
                    Khối {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents grid */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-lg" style={{ color: colors.brown }}>
              {documents.length === 0
                ? "Chưa có tài liệu nào"
                : "Không tìm thấy tài liệu phù hợp"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <Link
                key={doc._id?.toString() || ""}
                href={`/documents/${doc._id}`}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3
                      className="text-lg font-bold mb-2"
                      style={{ color: colors.darkBrown }}
                    >
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: colors.lightGreen,
                          color: colors.darkBrown,
                        }}
                      >
                        {doc.category}
                      </span>
                      {doc.grade && (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: colors.light,
                            color: colors.brown,
                          }}
                        >
                          Khối {doc.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {doc.note && (
                  <p
                    className="text-sm mb-4 line-clamp-2"
                    style={{ color: colors.brown }}
                  >
                    {doc.note}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ color: colors.brown }}
                  >
                    {doc.fileName}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: colors.mediumGreen }}
                  >
                    Xem →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

