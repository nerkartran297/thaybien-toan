"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

const colors = {
  light: "#F0EAD2",
  lightGreen: "#DDE5B6",
  mediumGreen: "#ADC178",
  brown: "#A98467",
  darkBrown: "#6C584C",
};

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
  type = "info",
}: ConfirmModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmButtonColor =
    type === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : type === "warning"
      ? "bg-orange-600 hover:bg-orange-700"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200] transition-opacity"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl transition-all transform"
        style={{
          borderColor: colors.brown,
          borderWidth: "2px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h3
            className="text-xl font-bold"
            style={{ color: colors.darkBrown }}
          >
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p style={{ color: colors.darkBrown }}>{message}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg transition-colors font-medium"
            style={{
              backgroundColor: colors.light,
              color: colors.darkBrown,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors font-medium text-white ${confirmButtonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to show confirm modal (returns a promise)
export const showConfirm = (
  title: string,
  message: string,
  options?: {
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
  }
): Promise<boolean> => {
  return new Promise((resolve) => {
    const modalId = `confirm-modal-${Date.now()}`;
    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      window.removeEventListener("confirm-modal-confirm", handleConfirm);
      window.removeEventListener("confirm-modal-cancel", handleCancel);
      const modal = document.getElementById(modalId);
      if (modal) modal.remove();
    };

    window.addEventListener("confirm-modal-confirm", handleConfirm);
    window.addEventListener("confirm-modal-cancel", handleCancel);

    window.dispatchEvent(
      new CustomEvent("show-confirm-modal", {
        detail: {
          id: modalId,
          title,
          message,
          confirmText: options?.confirmText || "Xác nhận",
          cancelText: options?.cancelText || "Hủy",
          type: options?.type || "info",
        },
      })
    );
  });
};

