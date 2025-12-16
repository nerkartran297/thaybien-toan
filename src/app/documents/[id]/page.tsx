"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Document } from "@/models/Document";
import { showError } from "@/lib/toast";

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const documentId = params?.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && documentId) {
      fetchDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
        // Use API endpoint to serve PDF with authentication
        setPdfUrl(
          `/api/documents/file?path=${encodeURIComponent(data.filePath)}`
        );
      } else {
        showError("Không tìm thấy tài liệu");
        router.push(
          user?.role === "student" ? "/student/documents" : "/teacher/documents"
        );
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      showError("Có lỗi xảy ra khi tải tài liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl && document) {
      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = document.fileName || document.name + ".pdf";
      if (typeof window !== "undefined") {
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    }
  };

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

  if (!document) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.light }}>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: colors.darkBrown }}
            >
              Không tìm thấy tài liệu
            </h2>
            <p style={{ color: colors.brown }}>
              Tài liệu không tồn tại hoặc bạn không có quyền truy cập.
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
        backgroundColor: colors.light,
      }}
    >
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-100px)]">
        {/* Document info header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1
                className="text-2xl font-bold mb-2"
                style={{ color: colors.darkBrown }}
              >
                {document.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: colors.lightGreen,
                    color: colors.darkBrown,
                  }}
                >
                  {document.category}
                </span>
                {document.grade && (
                  <span
                    className="px-3 py-1 rounded text-sm font-medium"
                    style={{
                      backgroundColor: colors.light,
                      color: colors.brown,
                    }}
                  >
                    Khối {document.grade}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: colors.mediumGreen,
                  color: "white",
                }}
              >
                ⬇️ Tải xuống
              </button>
              <button
                onClick={() =>
                  router.push(
                    user?.role === "student"
                      ? "/student/documents"
                      : "/teacher/documents"
                  )
                }
                className="px-4 py-2 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: colors.brown,
                  color: "white",
                }}
              >
                Quay lại
              </button>
            </div>
          </div>
          {document.note && (
            <p className="text-sm mt-4" style={{ color: colors.brown }}>
              {document.note}
            </p>
          )}
        </div>

        {pdfUrl ? (
          <div
            className="bg-white rounded-lg shadow-lg overflow-hidden border-2"
            style={{ borderColor: colors.brown }}
          >
            {/* PDF Viewer */}
            <div
              className="w-full relative"
              style={{
                height: "calc(100vh - 300px)",
                minHeight: "600px",
              }}
            >
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title={document.name}
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
                  <strong>Lưu ý:</strong> Bạn có thể tải xuống tài liệu bằng nút
                  "Tải xuống" ở trên hoặc sử dụng chức năng in/save của trình
                  duyệt.
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
