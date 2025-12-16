/**
 * Confirm modal utility functions
 * Use these instead of confirm()
 */

export type ConfirmType = "danger" | "warning" | "info";

interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

export const showConfirm = (
  title: string,
  message: string,
  options?: ConfirmOptions
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

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
    };

    window.addEventListener("confirm-modal-confirm", handleConfirm, {
      once: true,
    });
    window.addEventListener("confirm-modal-cancel", handleCancel, {
      once: true,
    });

    window.dispatchEvent(
      new CustomEvent("show-confirm-modal", {
        detail: {
          id: `confirm-modal-${Date.now()}`,
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

