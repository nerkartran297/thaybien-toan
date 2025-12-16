"use client";

import { useState, useEffect } from "react";
import { ConfirmModal } from "./ConfirmModal";

interface ConfirmModalData {
  id: string;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: "danger" | "warning" | "info";
}

export const ConfirmModalProvider = () => {
  const [modal, setModal] = useState<ConfirmModalData | null>(null);

  useEffect(() => {
    const handleShowConfirm = (e: Event) => {
      const customEvent = e as CustomEvent;
      const {
        id,
        title,
        message,
        confirmText,
        cancelText,
        type,
      } = customEvent.detail;

      setModal({
        id,
        title,
        message,
        confirmText,
        cancelText,
        type,
      });
    };

    window.addEventListener("show-confirm-modal", handleShowConfirm);

    return () => {
      window.removeEventListener("show-confirm-modal", handleShowConfirm);
    };
  }, []);

  const handleConfirm = () => {
    window.dispatchEvent(new CustomEvent("confirm-modal-confirm"));
    setModal(null);
  };

  const handleCancel = () => {
    window.dispatchEvent(new CustomEvent("confirm-modal-cancel"));
    setModal(null);
  };

  if (!modal) return null;

  return (
    <ConfirmModal
      isOpen={true}
      title={modal.title}
      message={modal.message}
      confirmText={modal.confirmText}
      cancelText={modal.cancelText}
      type={modal.type}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

