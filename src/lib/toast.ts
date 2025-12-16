/**
 * Toast utility functions
 * Use these instead of alert()
 */

export type ToastType = "error" | "success" | "info";

export const showToast = (
  message: string,
  type: ToastType = "info"
) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message, type },
      })
    );
  }
};

// Convenience functions
export const showError = (message: string) => showToast(message, "error");
export const showSuccess = (message: string) => showToast(message, "success");
export const showInfo = (message: string) => showToast(message, "info");

