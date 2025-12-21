"use client";

import { useState, useEffect, useRef } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "error" | "success" | "info";
  createdAt: number;
}

const TOAST_DURATION = 3000;
const MAX_TOASTS = 3;

/**
 * ToastStack component - Displays toast notifications
 * - Each toast has independent lifecycle
 * - Auto-dismiss after 3 seconds
 * - Stack vertically with gap
 */
export const ToastStack = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Listen for new toasts
  useEffect(() => {
    const handleAddToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { message, type } = customEvent.detail;

      const newToast: ToastItem = {
        id: `toast-${Date.now()}-${Math.random()}`,
        message,
        type: type || "info",
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Check if same toast already exists (prevent duplicates)
        const exists = prev.some(
          (t) =>
            t.message === message &&
            t.type === type &&
            Date.now() - t.createdAt < 100
        );
        if (exists) return prev;

        const updated = [...prev, newToast];
        // Keep only max toasts
        return updated.slice(-MAX_TOASTS);
      });
    };

    window.addEventListener("show-toast", handleAddToast);

    return () => {
      window.removeEventListener("show-toast", handleAddToast);
    };
  }, []);

  // Auto-dismiss logic
  useEffect(() => {
    if (toasts.length === 0) return;

    const newToasts = toasts.filter(
      (toast) => !timersRef.current.has(toast.id)
    );

    newToasts.forEach((toast) => {
      // Start exit animation
      setTimeout(() => {
        setExitingIds((prev) => new Set([...prev, toast.id]));
      }, TOAST_DURATION - 300);

      // Remove toast after fade animation
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(toast.id);
          return next;
        });
        timersRef.current.delete(toast.id);
      }, TOAST_DURATION);

      timersRef.current.set(toast.id, timer);
    });

    // Cleanup timers for removed toasts
    timersRef.current.forEach((timer, toastId) => {
      if (!toasts.some((t) => t.id === toastId)) {
        clearTimeout(timer);
        timersRef.current.delete(toastId);
      }
    });
  }, [toasts]);

  if (toasts.length === 0) return null;

  // const colors = {
  //   light: "#F0EAD2",
  //   lightGreen: "#DDE5B6",
  //   mediumGreen: "#ADC178",
  //   brown: "#A98467",
  //   darkBrown: "#6C584C",
  // };

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-3 sm:p-6 pointer-events-none">
      {toasts.map((toast) => {
        const bgColor =
          toast.type === "error"
            ? "bg-gradient-to-br from-red-600/90 to-red-700/90"
            : toast.type === "success"
            ? "bg-gradient-to-br from-green-600/90 to-green-700/90"
            : "bg-gradient-to-br from-blue-600/90 to-blue-700/90";

        const isExiting = exitingIds.has(toast.id);

        return (
          <div
            key={toast.id}
            className={`${bgColor} backdrop-blur-md text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3 w-[calc(100vw-24px)] max-w-[320px] sm:w-[320px] min-h-[56px] sm:h-[60px] border border-white/10 hover:border-white/20 transition-all duration-300 pointer-events-auto ${
              isExiting
                ? "opacity-0 translate-x-full"
                : "animate-[slideInRight_0.4s_ease-out]"
            }`}
          >
            {/* Icon */}
            {toast.type === "error" && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-700/30 shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-red-100"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            )}
            {toast.type === "success" && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-700/30 shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-green-100"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
            {toast.type === "info" && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-700/30 shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-blue-100"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
            )}

            {/* Message */}
            <span className="flex-1 font-medium text-xs sm:text-sm leading-snug">
              {toast.message.length > 60
                ? `${toast.message.slice(0, 57)}...`
                : toast.message}
            </span>

            {/* Close button */}
            <button
              onClick={() => {
                const timer = timersRef.current.get(toast.id);
                if (timer) clearTimeout(timer);
                timersRef.current.delete(toast.id);
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                setExitingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(toast.id);
                  return next;
                });
              }}
              className="hover:bg-white/20 rounded-lg p-1.5 transition-all hover:rotate-90 duration-300 shrink-0"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Helper function to show toast
export const showToast = (
  message: string,
  type: "error" | "success" | "info" = "info"
) => {
  window.dispatchEvent(
    new CustomEvent("show-toast", {
      detail: { message, type },
    })
  );
};

