"use client";

import React, { useState, useEffect } from "react";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { showError } from "@/lib/toast";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

export default function DocumentPage() {
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === "student" && user._id) {
      fetchStudentData(user._id.toString());
    } else if (user && user.role !== "student") {
      setLoading(false);
    } else if (!user) {
      setLoading(false);
    }
  }, [user]);

  // Disable right-click, text selection, and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Ctrl+S (Save), Ctrl+P (Print), Ctrl+A (Select All), F12 (DevTools)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" ||
          e.key === "S" ||
          e.key === "p" ||
          e.key === "P" ||
          e.key === "a" ||
          e.key === "A")
      ) {
        e.preventDefault();
        return false;
      }
      // Disable F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  const fetchStudentData = async (id: string) => {
    try {
      // Fetch enrollment (include both active and pending statuses)
      const enrollmentResponse = await fetch(
        `/api/enrollments?studentId=${id}`
      );
      if (enrollmentResponse.ok) {
        const enrollments = await enrollmentResponse.json();
        // Filter for active or pending enrollments
        const activeEnrollments = enrollments.filter(
          (e: StudentEnrollment) =>
            e.status === "active" || e.status === "pending"
        );

        if (activeEnrollments.length > 0) {
          const currentEnrollment = activeEnrollments[0];
          setEnrollment(currentEnrollment);

          // Use API endpoint to serve PDF with authentication
          // This prevents direct access to PDF file
          setPdfUrl("/api/documents/tai-lieu-hoc-tap.pdf");
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      showError("Có lỗi xảy ra khi tải thông tin");
    } finally {
      setLoading(false);
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

  if (!user || user.role !== "student") {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--page-background)" }}
      >
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "#6C584C" }}
            >
              Trang này chỉ dành cho học viên
            </h2>
            <p style={{ color: "#6C584C" }}>
              Vui lòng đăng nhập với tài khoản học viên để xem tài liệu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--page-background)" }}
      >
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "#6C584C" }}
            >
              Bạn chưa đăng ký khóa học nào
            </h2>
            <p style={{ color: "#6C584C" }}>
              Vui lòng đăng ký khóa học để xem tài liệu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--page-background)",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-100px)]">
        {pdfUrl ? (
          <div
            className="bg-white rounded-lg shadow-lg overflow-hidden border-2"
            style={{ borderColor: colors.brown }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          >
            {/* PDF Viewer */}
            <div
              className="w-full relative"
              style={{
                height: "calc(100vh - 150px)",
                minHeight: "600px",
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full"
                title="Tài liệu học tập"
                style={{
                  border: "none",
                }}
                allow="fullscreen"
                onLoad={(e) => {
                  // Try to inject custom scrollbar styles into iframe
                  try {
                    const iframe = e.currentTarget as HTMLIFrameElement;
                    const iframeDoc =
                      iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                      const style = iframeDoc.createElement("style");
                      style.textContent = `
                        /* Custom Scrollbar for PDF Viewer */
                        ::-webkit-scrollbar {
                          width: 12px;
                          height: 12px;
                        }
                        ::-webkit-scrollbar-track {
                          background: #F0EAD2;
                          border-radius: 10px;
                        }
                        ::-webkit-scrollbar-thumb {
                          background: #ADC178;
                          border-radius: 10px;
                          border: 2px solid #F0EAD2;
                        }
                        ::-webkit-scrollbar-thumb:hover {
                          background: #A98467;
                        }
                        /* Firefox */
                        * {
                          scrollbar-width: thin;
                          scrollbar-color: #ADC178 #F0EAD2;
                        }
                      `;
                      iframeDoc.head.appendChild(style);
                    }
                  } catch (error) {
                    // Cross-origin or other error, ignore
                    console.log("Cannot style iframe scrollbar:", error);
                  }
                }}
              />
              {/* Transparent overlay to catch right-clicks */}
              <div
                className="absolute inset-0"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                  pointerEvents: "none",
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
                onMouseDown={(e) => {
                  // Block right click
                  if (e.button === 2) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div
            className="bg-white rounded-lg shadow-lg p-8 text-center border-2"
            style={{ borderColor: colors.brown }}
          >
            <p style={{ color: colors.darkBrown }}>
              Tài liệu đang được cập nhật. Vui lòng quay lại sau.
            </p>
          </div>
        )}
      </div>

      {/* Floating Help Button */}
      {pdfUrl && (
        <button
          onClick={() => setShowHelpModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl z-50"
          style={{
            backgroundColor: colors.mediumGreen,
            color: "white",
          }}
          title="Hướng dẫn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100] p-4"
          onClick={() => setShowHelpModal(false)}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            style={{ borderColor: colors.brown, borderWidth: "2px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-xl font-bold"
                style={{ color: colors.darkBrown }}
              >
                Hướng dẫn xem tài liệu
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-2xl font-bold hover:opacity-70 transition-opacity"
                style={{ color: colors.darkBrown }}
              >
                ×
              </button>
            </div>
            <div style={{ color: colors.darkBrown }} className="space-y-4">
              <p className="text-base">Để phóng to hoặc thu nhỏ tài liệu:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Click vào bất kỳ vị trí nào trong tài liệu</li>
                <li>
                  Giữ phím{" "}
                  <kbd className="px-2 py-1 bg-gray-200 rounded font-mono text-sm">
                    Ctrl
                  </kbd>{" "}
                  (hoặc{" "}
                  <kbd className="px-2 py-1 bg-gray-200 rounded font-mono text-sm">
                    Cmd
                  </kbd>{" "}
                  trên Mac)
                </li>
                <li>
                  Lăn chuột lên để <strong>phóng to</strong> hoặc lăn xuống để{" "}
                  <strong>thu nhỏ</strong>
                </li>
              </ol>
              <div
                className="mt-4 p-3 rounded"
                style={{ backgroundColor: colors.light }}
              >
                <p className="text-sm">
                  <strong>Lưu ý:</strong> Bạn cần click vào vùng tài liệu trước
                  khi sử dụng phím tắt này.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2 rounded-lg text-white transition-colors font-medium"
                style={{
                  backgroundColor: colors.mediumGreen,
                }}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
