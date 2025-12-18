"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useExam } from "@/contexts/ExamContext";

export function useBlockNavigation() {
  const { isExamInProgress, activeAttempt } = useExam();
  const router = useRouter();
  const pathname = usePathname();
  const isOnExamPage = pathname?.includes("/student/exams/") && pathname?.includes("/take");
  const historyPushedRef = useRef(false);

  useEffect(() => {
    // Only block if exam is in progress and user is NOT on the exam page
    if (isExamInProgress() && !isOnExamPage && activeAttempt) {
      // Redirect back to exam page
      router.push(`/student/exams/${activeAttempt.examId}/take`);
    }
  }, [isExamInProgress, isOnExamPage, activeAttempt, router, pathname]);

  // Block browser back button and prevent navigation away
  useEffect(() => {
    if (!isExamInProgress() || !isOnExamPage) {
      historyPushedRef.current = false;
      return;
    }

    // Push a fake state to history stack to prevent back navigation
    if (!historyPushedRef.current) {
      window.history.pushState(null, "", window.location.href);
      historyPushedRef.current = true;
    }

    const handlePopState = (e: PopStateEvent) => {
      // Prevent back navigation - push the state back
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
      // Show alert
      alert("Bạn đang làm bài thi, không thể quay lại trang trước!");
    };

    // Listen for back/forward button
    window.addEventListener("popstate", handlePopState);

    // Also prevent any navigation attempts
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom message, but we can still trigger the dialog
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isExamInProgress, isOnExamPage]);

  return { isExamInProgress: isExamInProgress() };
}

